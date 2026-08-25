import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { Booking, BookingStatus, Message, PersistedState, Role, User, UserPreferences } from '@/domain/models';
import { addBooking, appendMessage, defaultPreferences, markMessagesRead, seedBookings, seedMessages, updateBookingStatus, updateBookingTime, validatePersistedState } from './app-store-core';
import { getDataMode } from '@/data/supabase-client';
import { createSupabaseSessionRepository } from '@/data/supabase-session-repository';

type AppStore = {
  role: Role;
  currentUser: User | null;
  setRole: (role: Role) => void;
  bookings: Booking[];
  messages: Message[];
  preferences: UserPreferences;
  hydrated: boolean;
  authBootstrapState: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  persistenceError: string | null;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'confirmationCode' | 'cancellationPolicy'>) => string;
  rescheduleBooking: (id: string, startsAt: string) => void;
  cancelBooking: (id: string) => void;
  restoreBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  resetDemoData: () => void;
  sendMessage: (message: Omit<Message, 'id' | 'sentAt' | 'unread'>) => void;
  markMessagesRead: (participantId: string) => void;
  clearPersistenceError: () => void;
  updatePreferences: (changes: Partial<UserPreferences>) => void;
};

const STORAGE_KEY = 'fade-society-demo-state-v1';
const AppStoreContext = createContext<AppStore | null>(null);
let nativeSessionState: string | null = null;

async function readState(): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage.getItem(STORAGE_KEY);
  return nativeSessionState;
}

async function writeState(state: PersistedState): Promise<void> {
  const serialized = JSON.stringify(state);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, serialized);
    return;
  }
  nativeSessionState = serialized;
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(() => getDataMode() === 'local' ? seedBookings : []);
  const [messages, setMessages] = useState<Message[]>(() => getDataMode() === 'local' ? seedMessages : []);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(() => getDataMode() !== 'local');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [authBootstrapState, setAuthBootstrapState] = useState<AppStore['authBootstrapState']>(() => getDataMode() === 'local' ? 'unauthenticated' : 'loading');

  useEffect(() => {
    let active = true;
    const dataMode = getDataMode();

    const loadPersistedState = async () => {
      try {
        const serialized = await readState();
        if (!serialized) return;
        const parsed = validatePersistedState(JSON.parse(serialized));
        if (!parsed) {
          if (active) setPersistenceError('Saved demo data was invalid and has been reset.');
          return;
        }
        if (!active) return;
        setRole(parsed.role);
        setBookings(parsed.bookings);
        setMessages(parsed.messages);
        setPreferences(parsed.preferences);
      } catch {
        if (active) setPersistenceError('Saved demo data could not be loaded.');
      } finally {
        if (active) setHydrated(true);
      }
    };

    if (dataMode === 'local') void loadPersistedState();
    if (dataMode !== 'supabase') {
      return () => { active = false; };
    }

    const repository = createSupabaseSessionRepository();
    void repository.getCurrentUser()
      .then((user) => {
        if (!active) return;
        setCurrentUser(user);
        if (user) setRole(user.role);
        setAuthBootstrapState(user ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (active) setAuthBootstrapState('error');
      });
    const unsubscribe = repository.subscribeToAuthState((user, error) => {
      if (!active) return;
      if (error) {
        setAuthBootstrapState('error');
        return;
      }
      setCurrentUser(user);
      if (user) {
        setRole(user.role);
        setAuthBootstrapState('authenticated');
      } else {
        setRole('customer');
        setBookings([]);
        setMessages([]);
        setPreferences(defaultPreferences);
        setAuthBootstrapState('unauthenticated');
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!hydrated || getDataMode() !== 'local') return;
    writeState({ version: 1, role, bookings, messages, preferences }).catch(() => setPersistenceError('Changes could not be saved locally.'));
  }, [bookings, hydrated, messages, preferences, role]);

  const value = useMemo<AppStore>(() => ({
    role,
    currentUser,
    bookings,
    messages,
    preferences,
    hydrated,
    authBootstrapState,
    persistenceError,
    setRole: (nextRole) => {
      if (getDataMode() === 'local') setRole(nextRole);
    },
    addBooking: (booking) => {
      const next = addBooking(bookings, { ...booking, cancellationPolicy: 'Free cancellation up to 24 hours before your appointment.' });
      setBookings(next);
      return next[next.length - 1].id;
    },
    rescheduleBooking: (id, startsAt) => setBookings((current) => updateBookingTime(current, id, startsAt)),
    cancelBooking: (id) => setBookings((current) => updateBookingStatus(current, id, 'cancelled')),
    restoreBooking: (id) => setBookings((current) => updateBookingStatus(current, id, 'confirmed')),
    completeBooking: (id) => setBookings((current) => updateBookingStatus(current, id, 'completed')),
    resetDemoData: () => {
      if (getDataMode() !== 'local') return;
      setRole('customer');
      setBookings(seedBookings);
      setMessages(seedMessages);
      setPreferences(defaultPreferences);
      setPersistenceError(null);
    },
    sendMessage: (message) => setMessages((current) => appendMessage(current, message)),
    markMessagesRead: (participantId) => setMessages((current) => markMessagesRead(current, participantId)),
    clearPersistenceError: () => setPersistenceError(null),
    updatePreferences: (changes) => setPreferences((current) => ({ ...current, ...changes })),
  }), [authBootstrapState, bookings, currentUser, hydrated, messages, persistenceError, preferences, role]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}

export type { AppStore, Booking, BookingStatus, Role };
