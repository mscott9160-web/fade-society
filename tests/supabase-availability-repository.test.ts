import { describe, expect, it, vi } from 'vitest';
import type { ProviderAvailabilitySlot } from '../src/domain/models';
import { createSupabaseAvailabilityRepository } from '../src/data/supabase-availability-repository';

type AvailabilityRpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{
    data: ProviderAvailabilitySlot[] | null;
    error: Error | null;
  }>;
};

function makeClient(data: ProviderAvailabilitySlot[] | null = [], error: Error | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return { client: { rpc } as unknown as AvailabilityRpcClient, rpc };
}

describe('Supabase availability repository', () => {
  it('calls provider availability RPCs with server-authoritative arguments', async () => {
    const { client, rpc } = makeClient([{
      id: 'slot-1', barber_id: 'barber-1', starts_at: '2026-08-24T10:00:00Z', ends_at: '2026-08-24T11:00:00Z', available: true,
    } as unknown as ProviderAvailabilitySlot]);
    const repository = createSupabaseAvailabilityRepository(client);
    await repository.listProviderSlots('user-1', 'barber-1', '2026-08-24T00:00:00Z', '2026-08-25T00:00:00Z');
    await repository.addProviderSlot('user-1', 'barber-1', '2026-08-24T10:00:00Z', '2026-08-24T11:00:00Z');
    await repository.removeProviderSlot('user-1', 'slot-1');
    expect(rpc).toHaveBeenNthCalledWith(1, 'list_provider_availability', { p_barber_id: 'barber-1', p_from: '2026-08-24T00:00:00Z', p_to: '2026-08-25T00:00:00Z' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'add_provider_availability', { p_barber_id: 'barber-1', p_starts_at: '2026-08-24T10:00:00Z', p_ends_at: '2026-08-24T11:00:00Z' });
    expect(rpc).toHaveBeenNthCalledWith(3, 'remove_provider_availability', { p_slot_id: 'slot-1' });
  });

  it('propagates RPC errors and rejects empty mutations', async () => {
    const { client } = makeClient(null, new Error('availability failed'));
    await expect(createSupabaseAvailabilityRepository(client).listProviderSlots('u', 'b', 'from', 'to')).rejects.toThrow('availability failed');
    const empty = makeClient([]);
    await expect(createSupabaseAvailabilityRepository(empty.client).addProviderSlot('u', 'b', 'from', 'to')).rejects.toThrow('Add availability RPC returned no slot');
    await expect(createSupabaseAvailabilityRepository(empty.client).removeProviderSlot('u', 'slot')).rejects.toThrow('Remove availability RPC returned no slot');
  });
});