import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.doUnmock('@supabase/supabase-js');
});

describe('Supabase client', () => {
  it('creates one client for repeated access', async () => {
    const createClient = vi.fn(() => ({}) as never);
    vi.doMock('@supabase/supabase-js', () => ({ createClient }));
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const { getSupabaseClient } = await import('../src/data/supabase-client');
    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledOnce();
  });
});

describe('data mode configuration', () => {
  it('defaults to local mode without public Supabase configuration', async () => {
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', '');
    const { getDataMode, getSupabaseClientConfig } = await import('../src/data/supabase-client');
    expect(getDataMode()).toBe('local');
    expect(getSupabaseClientConfig()).toBeNull();
  });
});
