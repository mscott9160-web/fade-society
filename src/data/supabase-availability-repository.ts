import type { ProviderAvailabilitySlot } from '@/domain/models';
import type { AvailabilityRepository } from './repositories';
import { getSupabaseClient } from './supabase-client';

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: ProviderAvailabilitySlot[] | null; error: Error | null }> };
function requireClient(client: RpcClient | null): RpcClient { if (!client) throw new Error('Supabase is not configured'); return client; }
function one(data: ProviderAvailabilitySlot[] | null, message: string): ProviderAvailabilitySlot { if (!data?.[0]) throw new Error(message); return data[0]; }

export function createSupabaseAvailabilityRepository(client?: RpcClient | null): AvailabilityRepository {
  const configuredClient = client === undefined ? getSupabaseClient() as unknown as RpcClient | null : client;
  const supabase = () => requireClient(configuredClient);
  return {
    listProviderSlots: async (userId, barberId, from, to) => { const result = await supabase().rpc('list_provider_availability', { p_barber_id: barberId, p_from: from, p_to: to }); if (result.error) throw result.error; return result.data ?? []; },
    addProviderSlot: async (userId, barberId, startsAt, endsAt) => { const result = await supabase().rpc('add_provider_availability', { p_barber_id: barberId, p_starts_at: startsAt, p_ends_at: endsAt }); if (result.error) throw result.error; return one(result.data, 'Add availability RPC returned no slot'); },
    removeProviderSlot: async (userId, slotId) => { const result = await supabase().rpc('remove_provider_availability', { p_slot_id: slotId }); if (result.error) throw result.error; return one(result.data, 'Remove availability RPC returned no slot'); },
  };
}