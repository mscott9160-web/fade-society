import { describe, expect, it, vi } from 'vitest';
import { createSupabaseMessageRepository, type MessageClient } from '../src/data/supabase-message-repository';

const row = { id: 'm1', participant_id: 'barber-1', participant_name: 'Morgan', body: 'See you soon', created_at: '2026-08-25T10:00:00Z', unread: true };

function client(data: unknown[] | null = [row], error: Error | null = null) {
  const calls: unknown[][] = [];
  const value = { rpc: vi.fn((name: string, args: Record<string, unknown>) => { calls.push([name, args]); return Promise.resolve({ data, error }); }) } as unknown as MessageClient;
  return { value, calls };
}

describe('Supabase message repository', () => {
  it('maps thread rows and calls the discovery RPC', async () => {
    const mocked = client();
    await expect(createSupabaseMessageRepository(mocked.value).listThreads('user-1')).resolves.toEqual([{ id: 'm1', participantId: 'barber-1', participantName: 'Morgan', body: 'See you soon', sentAt: row.created_at, unread: true }]);
    expect(mocked.calls).toEqual([['list_my_messages', {}]]);
  });

  it('sends with the idempotency key and maps the returned message', async () => {
    const mocked = client([{ ...row, unread: false }]);
    await expect(createSupabaseMessageRepository(mocked.value).send('user-1', 'barber-1', 'Hello', 'key-1')).resolves.toMatchObject({ participantId: 'barber-1', body: 'See you soon', unread: false });
    expect(mocked.calls).toEqual([['send_message', { p_participant_id: 'barber-1', p_body: 'Hello', p_idempotency_key: 'key-1' }]]);
  });

  it('marks a conversation read and propagates backend errors', async () => {
    const mocked = client([]);
    await expect(createSupabaseMessageRepository(mocked.value).markRead('user-1', 'barber-1')).resolves.toBeUndefined();
    expect(mocked.calls).toEqual([['mark_conversation_read', { p_participant_id: 'barber-1' }]]);
    await expect(createSupabaseMessageRepository(client([], new Error('rpc failed')).value).listThreads('user-1')).rejects.toThrow('rpc failed');
  });

  it('rejects missing configuration and empty send responses', async () => {
    await expect(createSupabaseMessageRepository(null).listThreads('user-1')).rejects.toThrow('Supabase is not configured');
    await expect(createSupabaseMessageRepository(client([]).value).send('user-1', 'barber-1', 'Hi', 'key')).rejects.toThrow('returned no message');
  });
});