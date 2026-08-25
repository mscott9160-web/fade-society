import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseClientConfig = {
  url: string;
  anonKey: string;
};

export type DataMode = 'local' | 'supabase';

export function getSupabaseClientConfig(): SupabaseClientConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getDataMode(): DataMode {
  if (process.env.EXPO_PUBLIC_DATA_MODE === 'supabase') return 'supabase';
  return 'local';
}

// The anon key is client-safe; service-role keys must only exist in Edge Functions.
export const supabaseClientConfig = getSupabaseClientConfig();

let supabaseClient: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient !== undefined) return supabaseClient;
  if (!supabaseClientConfig) {
    supabaseClient = null;
    return supabaseClient;
  }
  supabaseClient = createClient(supabaseClientConfig.url, supabaseClientConfig.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return supabaseClient;
}