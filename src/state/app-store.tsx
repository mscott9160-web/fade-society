import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { Booking, BookingStatus, Message, PersistedState, Role, UserPreferences } from '@/domain/models';
import { addBooking, appendMessage, defaultPreferences, markMessagesRead, seedBookings, seedMessages, updateBookingStatus, updateBookingTime, validatePersistedState } from './app-store-core';

type AppStore = {
  role: Role;
  setRole: (role: Role) => void;
  bookings: Booking[];
  messages: Message[];
  preferences: UserPreferences;
  hydrated: boolean;
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
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    readState()
      .then((serialized) => {
        if (!serialized) return;
        const parsed = validatePersistedState(JSON.parse(serialized));
        if (!parsed) {
          setPersistenceError('Saved demo data was invalid and has been reset.');
          return;
        }
        setRole(parsed.role);
        setBookings(parsed.bookings);
        setMessages(parsed.messages);
        setPreferences(parsed.preferences);
      })
      .catch(() => setPersistenceError('Saved demo data could not be loaded.'))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeState({ version: 1, role, bookings, messages, preferences }).catch(() => setPersistenceError('Changes could not be saved locally.'));
  }, [bookings, hydrated, messages, preferences, role]);

  const value = useMemo<AppStore>(() => ({
    role,
    setRole,
    bookings,
    messages,
    preferences,
    hydrated,
    persistenceError,
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
  }), [bookings, hydrated, messages, persistenceError, preferences, role]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}

export type { AppStore, Booking, BookingStatus, Role };
