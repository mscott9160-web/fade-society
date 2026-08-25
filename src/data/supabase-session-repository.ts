import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Role, User } from '@/domain/models';
import type { AuthCredentials, AuthResult, AuthStateListener, SessionRepository } from './repositories';
import { getSupabaseClient } from './supabase-client';

type SessionClient = {
  auth: {
    getUser: () => Promise<{ data: { user: SupabaseUser | null }; error: Error | null }>;
    onAuthStateChange: (callback: (_event: string, session: { user: SupabaseUser } | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: SupabaseUser | null }; error: Error | null }>;
    signUp: (options: { email: string; password: string; options?: { data?: Record<string, string> } }) => Promise<{ data: { user: SupabaseUser | null }; error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { display_name: string; role: unknown } | null; error: Error | null }>;
      };
    };
  };
};

function mapProfile(authUser: SupabaseUser, profile: { display_name: string; role: unknown } | null, error: Error | null): User {
  if (error) throw error;
  if (!profile) throw new Error('Authenticated user profile is required');
  if (typeof profile.role !== 'string' || !['customer', 'barber', 'owner', 'admin'].includes(profile.role)) throw new Error('Authenticated user profile has an invalid role');
  return { id: authUser.id, displayName: profile.display_name, role: profile.role as Role };
}

export function createSupabaseSessionRepository(client?: SessionClient | null): SessionRepository {
  const configuredClient = client === undefined ? getSupabaseClient() as unknown as SessionClient | null : client;
  const requireClient = () => {
    if (!configuredClient) throw new Error('Supabase is not configured');
    return configuredClient;
  };

  const getProfile = async (authUser: SupabaseUser | null): Promise<User | null> => {
    if (!authUser) return null;
    const result = await requireClient().from('users').select('display_name, role').eq('id', authUser.id).maybeSingle();
    return mapProfile(authUser, result.data, result.error);
  };

  let authStateVersion = 0;

  const getCurrentUser = async () => {
    const result = await requireClient().auth.getUser();
    if (result.error) throw result.error;
    return getProfile(result.data.user);
  };

  const subscribeToAuthState = (listener: AuthStateListener) => {
    const result = requireClient().auth.onAuthStateChange((_event, session) => {
      const version = ++authStateVersion;
      if (!session?.user) {
        listener(null);
        return;
      }
      void getProfile(session.user)
        .then((user) => {
          if (version === authStateVersion) listener(user);
        })
        .catch((error: unknown) => {
          if (version === authStateVersion) listener(null, error instanceof Error ? error : new Error(String(error)));
        });
    });
    return () => result.data.subscription.unsubscribe();
  };

  const authenticate = async (credentials: AuthCredentials, mode: 'signIn' | 'signUp'): Promise<AuthResult> => {
    const result = mode === 'signIn'
      ? await requireClient().auth.signInWithPassword(credentials)
      : await requireClient().auth.signUp({ email: credentials.email, password: credentials.password, options: { data: credentials.displayName ? { display_name: credentials.displayName } : undefined } });
    if (result.error) throw result.error;
    const user = await getProfile(result.data.user);
    return { user, requiresEmailConfirmation: mode === 'signUp' && !result.data.user };
  };

  return {
    getCurrentUser,
    subscribeToAuthState,
    signIn: (credentials) => authenticate(credentials, 'signIn'),
    signUp: (credentials) => authenticate(credentials, 'signUp'),
    signOut: async () => {
      const result = await requireClient().auth.signOut();
      if (result.error) throw result.error;
    },
    updateRoleForDemo: async (role) => ({ id: 'demo', displayName: 'Demo', role }),
  };
}