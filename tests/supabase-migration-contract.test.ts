import { describe, expect, it } from 'vitest';

declare global {
  interface ImportMeta {
    glob: (pattern: string, options: { eager: boolean; query: string; import: string }) => Record<string, string>;
  }
}

function migration(name: string) {
  const migrations = import.meta.glob('../supabase/migrations/*.sql', { eager: true, query: '?raw', import: 'default' });
  const source = migrations[`../supabase/migrations/${name}`];
  if (!source) throw new Error(`Migration not found: ${name}`);
  return source;
}

describe('Supabase authorization and concurrency migration contracts', () => {
  it('prevents two active bookings from occupying one availability slot', () => {
    const sql = migration('0001_initial_schema.sql');
    expect(sql).toContain("create unique index bookings_one_active_per_slot");
    expect(sql).toContain("where status in ('pending', 'confirmed')");
  });

  it('makes booking retries actor-scoped and request-bound', () => {
    const sql = migration('0002_booking_rpc.sql');
      const schema = migration('0001_initial_schema.sql');
      expect(schema).toContain("unique (actor_id, idempotency_key)");
    expect(sql).toContain('existing_key.request_hash <> request_hash');
    expect(sql).toContain('current_user_id');
    expect(sql).toContain('for update');
  });

  it('restricts provider review to provider or explicit studio/admin scope', () => {
    const sql = migration('0011_provider_access_and_empty_threads.sql');
    expect(sql).toContain("membership_role in ('barber', 'owner', 'admin')");
    expect(sql).toContain("current_role <> 'admin'");
    expect(sql).toContain('target_booking.studio_id');
    expect(sql).toContain("Only pending bookings can be reviewed");
    expect(sql).toContain("p_status in ('completed', 'no_show')");
    expect(sql).toContain("target_booking.status <> 'confirmed'");
    expect(sql).toContain("jsonb_build_object('previous_status', previous_status, 'status', p_status)");
  });

  it('requires message membership, booking access, and idempotency hash equality', () => {
    const sql = migration('0009_booking_messaging_workflow.sql');
     const schema = migration('0005_messaging_rpc.sql');
    expect(sql).toContain('join public.conversation_members a');
    expect(sql).toContain('public.messaging_actor_can_access(c.id)');
    expect(sql).toContain('key.request_hash <> hash');
    expect(sql).toContain("Conversation access denied");
     expect(schema).toContain('primary key (actor_id, idempotency_key)');
  });

  it('keeps provider availability behind scoped, future-only RPCs', () => {
    const sql = migration('0014_provider_availability_slots.sql');
    expect(sql).toContain('create or replace function public.list_provider_availability');
    expect(sql).toContain('create or replace function public.add_provider_availability');
    expect(sql).toContain('create or replace function public.remove_provider_availability');
    expect(sql).toContain("membership_role in ('barber', 'owner', 'admin')");
    expect(sql).toContain('current_role <> \'admin\'');
    expect(sql).toContain('p_starts_at <= now()');
    expect(sql).toContain('p_starts_at >= p_ends_at');
    expect(sql).toContain('for update');
    expect(sql).toContain('where availability_slot_id = target_slot.id');
    expect(sql).toContain('timestamptz');
    expect(sql).toContain('revoke all on function');
  });
});