import { describe, expect, it } from 'vitest';
import { getDataMode, getSupabaseClientConfig } from '../src/data/supabase-client';

describe('data mode configuration', () => {
  it('defaults to local mode without public Supabase configuration', () => {
    expect(getDataMode()).toBe('local');
    expect(getSupabaseClientConfig()).toBeNull();
  });
});
