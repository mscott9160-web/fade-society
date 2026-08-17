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
  if (process.env.EXPO_PUBLIC_DATA_MODE === 'supabase' && getSupabaseClientConfig()) return 'supabase';
  return 'local';
}

// The anon key is client-safe; service-role keys must only exist in Edge Functions.
export const supabaseClientConfig = getSupabaseClientConfig();