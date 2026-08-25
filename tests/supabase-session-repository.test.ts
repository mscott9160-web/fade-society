import type { User as SupabaseUser } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { createSupabaseSessionRepository } from '../src/data/supabase-session-repository';

const authUser = { id: 'user-1' } as SupabaseUser;

function createClient() {
  const getUser = vi.fn(async (): Promise<{ data: { user: SupabaseUser | null }; error: Error | null }> => ({ data: { user: authUser }, error: null }));
  const signInWithPassword = vi.fn(async () => ({ data: { user: authUser }, error: null }));
  const signUp = vi.fn(async (): Promise<{ data: { user: SupabaseUser | null }; error: Error | null }> => ({ data: { user: authUser }, error: null }));
  const signOut = vi.fn(async () => ({ error: null }));
  const unsubscribe = vi.fn();
  const onAuthStateChange = vi.fn((callback: (_event: string, session: { user: SupabaseUser } | null) => void) => ({ data: { subscription: { unsubscribe } } }));
  const maybeSingle = vi.fn(async (): Promise<{ data: { display_name: string; role: 'barber' } | null; error: Error | null }> => ({ data: { display_name: 'Morgan', role: 'barber' }, error: null }));
  const client = {
    auth: { getUser, signInWithPassword, signUp, signOut, onAuthStateChange },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })),
  };
  return { client, getUser, signInWithPassword, signUp, signOut, maybeSingle, onAuthStateChange, unsubscribe };
}

describe('Supabase session repository', () => {
  it('maps the server profile role for the current authenticated user', async () => {
    const { client } = createClient();
    const repository = createSupabaseSessionRepository(client);

    await expect(repository.getCurrentUser()).resolves.toEqual({ id: 'user-1', displayName: 'Morgan', role: 'barber' });
  });

  it('returns no user when Supabase has no session', async () => {
    const { client, getUser } = createClient();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const repository = createSupabaseSessionRepository(client);

    await expect(repository.getCurrentUser()).resolves.toBeNull();
  });

  it('delegates sign-in and sign-up, including optional display name metadata', async () => {
    const { client, signInWithPassword, signUp } = createClient();
    const repository = createSupabaseSessionRepository(client);

    await repository.signIn({ email: 'morgan@example.com', password: 'secret' });
    await repository.signUp({ email: 'new@example.com', password: 'secret', displayName: 'New User' });

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'morgan@example.com', password: 'secret' });
    expect(signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'secret',
      options: { data: { display_name: 'New User' } },
    });
  });

  it('distinguishes email confirmation signup from an authenticated signup', async () => {
    const { client, signUp } = createClient();
    signUp.mockResolvedValue({ data: { user: null }, error: null });
    const repository = createSupabaseSessionRepository(client);

    await expect(repository.signUp({ email: 'new@example.com', password: 'secret' })).resolves.toEqual({
      user: null,
      requiresEmailConfirmation: true,
    });
  });

  it('signs out through Supabase and rejects an authenticated user without a profile', async () => {
    const { client, signOut, maybeSingle } = createClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const repository = createSupabaseSessionRepository(client);

    await expect(repository.getCurrentUser()).rejects.toThrow('Authenticated user profile is required');
    await repository.signOut();
    expect(signOut).toHaveBeenCalledOnce();
  });

  it('emits no session and mapped users for auth state transitions and unsubscribes', async () => {
    const { client, onAuthStateChange, unsubscribe } = createClient();
    const repository = createSupabaseSessionRepository(client);
    const listener = vi.fn();
    const stop = repository.subscribeToAuthState(listener);
    const callback = onAuthStateChange.mock.calls[0][0];

    callback('SIGNED_OUT', null);
    expect(listener).toHaveBeenCalledWith(null);
    callback('SIGNED_IN', { user: authUser });
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith({ id: 'user-1', displayName: 'Morgan', role: 'barber' }));
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('ignores a stale profile response after a newer auth event', async () => {
    const { client, onAuthStateChange, maybeSingle } = createClient();
    let resolveOldProfile: ((value: { data: { display_name: string; role: 'barber' } | null; error: Error | null }) => void) | undefined;
    maybeSingle.mockImplementationOnce(() => new Promise((resolve) => { resolveOldProfile = resolve; }));
    const repository = createSupabaseSessionRepository(client);
    const listener = vi.fn();
    repository.subscribeToAuthState(listener);
    const callback = onAuthStateChange.mock.calls[0][0];

    callback('SIGNED_IN', { user: authUser });
    callback('SIGNED_OUT', null);
    resolveOldProfile?.({ data: { display_name: 'Morgan', role: 'barber' }, error: null });
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(null));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});