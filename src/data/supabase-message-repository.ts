import type { Message } from '@/domain/models';
import type { MessageRepository } from './repositories';
import { getSupabaseClient } from './supabase-client';

type MessageRow = { id: string; conversation_id: string; booking_id?: string | null; participant_id: string; participant_name: string; body: string; created_at: string; unread: boolean };
export type MessageClient = { rpc: <Row>(name: string, args: Record<string, unknown>) => PromiseLike<{ data: Row[] | null; error: Error | null }> };

function throwIfError(error: unknown): void {
  if (!error) return;
  if (error instanceof Error) throw error;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') throw new Error(error.message);
  throw new Error('The messaging service returned an unknown error');
}

export function createSupabaseMessageRepository(client?: MessageClient | null): MessageRepository {
  const supabase = client === undefined ? getSupabaseClient() as unknown as MessageClient | null : client;
    function requireClient(client: MessageClient | null): MessageClient {
      if (!client) throw new Error('Supabase is not configured');
      return client;
    }
  const call = async (request: PromiseLike<{ data: MessageRow[] | null; error: Error | null }>) => { const result = await request; throwIfError(result.error); return result.data ?? []; };
  const api = () => requireClient(supabase);
  const map = (row: MessageRow): Message => ({ id: row.id, conversationId: row.conversation_id, bookingId: row.booking_id ?? undefined, participantId: row.participant_id, participantName: row.participant_name, body: row.body, sentAt: row.created_at, unread: row.unread });
  return {
    listThreads: async () => (await call(api().rpc<MessageRow>('list_my_messages', {}))).map(map),
    send: async (_userId, conversationId, body, idempotencyKey) => { const rows = await call(api().rpc<MessageRow>('send_message', { p_conversation_id: conversationId, p_body: body, p_idempotency_key: idempotencyKey })); if (!rows[0]) throw new Error('Send message RPC returned no message'); return map(rows[0]); },
    markRead: async (_userId, conversationId) => { await call(api().rpc<MessageRow>('mark_conversation_read', { p_conversation_id: conversationId })); },
  };
}