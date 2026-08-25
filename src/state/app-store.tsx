import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { AvailabilitySlot, Barber, Booking, BookingStatus, Message, PersistedState, Role, Service, Studio, User, UserPreferences } from '@/domain/models';
import type { AuthCredentials, AuthResult, CreateBookingInput } from '@/data/repositories';
import { addBooking, appendMessage, defaultPreferences, markMessagesRead, seedBookings, seedMessages, updateBookingStatus, updateBookingTime, validatePersistedState } from './app-store-core';
import { services as localServices } from '@/domain/catalog';
import { getDataMode } from '@/data/supabase-client';
import { createSupabaseRepositories } from '@/data/repository-factory';

type AppStore = {
  role: Role;
  currentUser: User | null;
  setRole: (role: Role) => void;
  bookings: Booking[];
  messages: Message[];
  preferences: UserPreferences;
  hydrated: boolean;
  studios: Studio[];
  barbers: Barber[];
  catalogLoading: boolean;
  catalogError: string | null;
  bookingLoading: boolean;
  bookingError: string | null;
  authBootstrapState: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  authError: string | null;
  persistenceError: string | null;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'confirmationCode' | 'cancellationPolicy'>) => string;
  createBooking: (input: CreateBookingInput, idempotencyKey: string) => Promise<Booking>;
  getBooking: (id: string) => Promise<Booking>;
  listServices: (barberId: string) => Promise<Service[]>;
  listAvailability: (barberId: string, from: string, to: string) => Promise<AvailabilitySlot[]>;
  refreshCatalog: () => Promise<void>;
  rescheduleBooking: (id: string, startsAt: string) => void;
  cancelBooking: (id: string) => void;
  restoreBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  resetDemoData: () => void;
  sendMessage: (message: Omit<Message, 'id' | 'sentAt' | 'unread'>) => void;
  markMessagesRead: (participantId: string) => void;
  clearPersistenceError: () => void;
  updatePreferences: (changes: Partial<UserPreferences>) => void;
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  retryAuthBootstrap: () => Promise<void>;
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
  const [hydrated, setHydrated] = useState(false);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(() => getDataMode() === 'supabase');
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(() => getDataMode() === 'supabase');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [authBootstrapState, setAuthBootstrapState] = useState<AppStore['authBootstrapState']>(() => getDataMode() === 'local' ? 'unauthenticated' : 'loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const authRequestVersion = useRef(0);
  const authenticatedUserId = useRef<string | null>(null);

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

    const repository = createSupabaseRepositories().session;
    const loadCurrentUser = async () => {
      const version = ++authRequestVersion.current;
      try {
        const user = await repository.getCurrentUser();
        if (!active || version !== authRequestVersion.current) return;
        setCurrentUser(user);
        if (user) setRole(user.role);
        setAuthBootstrapState(user ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        if (active && version === authRequestVersion.current) {
          setAuthError(error instanceof Error ? error.message : String(error));
          setAuthBootstrapState('error');
        }
      }
    };
    void loadCurrentUser();
    let unsubscribe: () => void = () => undefined;
    try {
      unsubscribe = repository.subscribeToAuthState((user, error) => {
      if (!active) return;
      authRequestVersion.current += 1;
      if (error) {
        setAuthError(error.message);
        setAuthBootstrapState('error');
        return;
      }
      setCurrentUser(user);
      if (user) {
        if (authenticatedUserId.current !== null && authenticatedUserId.current !== user.id) {
          setBookings([]);
          setMessages([]);
          setPreferences(defaultPreferences);
          setBookingError(null);
          setPersistenceError(null);
          setHydrated(false);
        }
        authenticatedUserId.current = user.id;
        setRole(user.role);
        setAuthBootstrapState('authenticated');
      } else {
        authenticatedUserId.current = null;
        setRole('customer');
        setBookings([]);
        setMessages([]);
        setPreferences(defaultPreferences);
        setAuthBootstrapState('unauthenticated');
      }
      });
    } catch (error) {
      if (active) {
        void Promise.resolve().then(() => {
          if (!active) return;
          setAuthError(error instanceof Error ? error.message : String(error));
          setAuthBootstrapState('error');
        });
      }
    }
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (getDataMode() !== 'supabase') return;
    let active = true;
    if (authBootstrapState !== 'authenticated' || !currentUser) {
      return () => { active = false; };
    }
    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const repository = createSupabaseRepositories().catalog;
        const [nextStudios, nextBarbers] = await Promise.all([repository.listStudios(), repository.listBarbers()]);
        if (!active) return;
        setStudios(nextStudios);
        setBarbers(nextBarbers);
      } catch (error) {
        if (active) setCatalogError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) setCatalogLoading(false);
      }
    };
    void loadCatalog();
    return () => { active = false; };
  }, [authBootstrapState, currentUser]);

  useEffect(() => {
    if (getDataMode() !== 'supabase') return;
    let active = true;
    if (!currentUser) {
      Promise.resolve().then(() => {
        if (!active) return;
        setBookings([]);
        setBookingLoading(false);
        setHydrated(authBootstrapState !== 'loading');
      });
      return () => { active = false; };
    }
    const loadBookings = async () => {
      setBookingLoading(true);
      setBookingError(null);
      try {
        const nextBookings = await createSupabaseRepositories().booking.listMine(currentUser.id);
        if (!active) return;
        setBookings(nextBookings);
      } catch (error) {
        if (active) setBookingError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) {
          setBookingLoading(false);
          setHydrated(true);
        }
      }
    };
    void loadBookings();
    return () => { active = false; };
  }, [authBootstrapState, currentUser]);

  useEffect(() => {
    if (!hydrated || getDataMode() !== 'local') return;
    writeState({ version: 1, role, bookings, messages, preferences }).catch(() => setPersistenceError('Changes could not be saved locally.'));
  }, [bookings, hydrated, messages, preferences, role]);

  const listServices = useCallback(async (barberId: string) => getDataMode() === 'local' ? localServices : createSupabaseRepositories().catalog.listServices(barberId), []);
  const listAvailability = useCallback(async (barberId: string, from: string, to: string) => getDataMode() === 'local' ? [] : createSupabaseRepositories().catalog.listAvailability(barberId, from, to), []);

  const value = useMemo<AppStore>(() => ({
    role,
    currentUser,
    bookings,
    messages,
    preferences,
    hydrated,
    authBootstrapState,
    authError,
    persistenceError,
    studios,
    barbers,
    catalogLoading,
    catalogError,
    bookingLoading,
    bookingError,
    setRole: (nextRole) => {
      if (getDataMode() === 'local') setRole(nextRole);
    },
    addBooking: (booking) => {
      if (getDataMode() !== 'local') throw new Error('Use createBooking for Supabase bookings');
      const next = addBooking(bookings, { ...booking, cancellationPolicy: 'Free cancellation up to 24 hours before your appointment.' });
      setBookings(next);
      return next[next.length - 1].id;
    },
    createBooking: async (input, idempotencyKey) => {
      if (getDataMode() === 'local') {
        const barber = barbers.find((item) => item.id === input.barberId);
        const studio = studios.find((item) => item.id === barber?.studioId);
        const service = localServices.find((item) => item.id === input.serviceId);
        const next = addBooking(bookings, { serviceId: input.serviceId, serviceName: service?.name ?? input.serviceId, barberId: input.barberId, barberName: barber?.name ?? input.barberId, studioId: studio?.id ?? '', studioName: studio?.name ?? '', startsAt: input.startsAt, price: service?.price ?? 0 });
        setBookings(next);
        return next[next.length - 1];
      }
      if (!currentUser) throw new Error('Sign in to book an appointment');
      const booking = await createSupabaseRepositories().booking.create(currentUser.id, input, idempotencyKey);
      setBookings((current) => [...current.filter((item) => item.id !== booking.id), booking]);
      return booking;
    },
    getBooking: async (id) => {
      if (getDataMode() === 'local') {
        const booking = bookings.find((item) => item.id === id);
        if (!booking) throw new Error('Booking not found');
        return booking;
      }
      if (!currentUser) throw new Error('Sign in to view this booking');
      const repository = createSupabaseRepositories().booking;
      if (!repository.getById) throw new Error('Booking lookup is not supported by the backend');
      const booking = await repository.getById(currentUser.id, id);
      setBookings((current) => [...current.filter((item) => item.id !== booking.id), booking]);
      return booking;
    },
    listServices,
    listAvailability,
    refreshCatalog: async () => {
      if (getDataMode() !== 'supabase') return;
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const repository = createSupabaseRepositories().catalog;
        const [nextStudios, nextBarbers] = await Promise.all([repository.listStudios(), repository.listBarbers()]);
        setStudios(nextStudios);
        setBarbers(nextBarbers);
      } catch (error) {
        setCatalogError(error instanceof Error ? error.message : String(error));
        throw error;
      } finally {
        setCatalogLoading(false);
      }
    },
    rescheduleBooking: (id, startsAt) => { if (getDataMode() === 'local') setBookings((current) => updateBookingTime(current, id, startsAt)); },
    cancelBooking: (id) => { if (getDataMode() === 'local') setBookings((current) => updateBookingStatus(current, id, 'cancelled')); },
    restoreBooking: (id) => { if (getDataMode() === 'local') setBookings((current) => updateBookingStatus(current, id, 'confirmed')); },
    completeBooking: (id) => { if (getDataMode() === 'local') setBookings((current) => updateBookingStatus(current, id, 'completed')); },
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
    signIn: async (credentials) => {
      if (getDataMode() === 'local') return { user: null, requiresEmailConfirmation: false };
      setAuthError(null);
      try {
        return await createSupabaseRepositories().session.signIn(credentials);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    signUp: async (credentials) => {
      if (getDataMode() === 'local') return { user: null, requiresEmailConfirmation: false };
      setAuthError(null);
      try {
        return await createSupabaseRepositories().session.signUp(credentials);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    signOut: async () => {
      if (getDataMode() === 'local') return;
      setAuthError(null);
      try {
        await createSupabaseRepositories().session.signOut();
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    retryAuthBootstrap: async () => {
      if (getDataMode() === 'local') return;
      const version = ++authRequestVersion.current;
      setAuthError(null);
      setAuthBootstrapState('loading');
      try {
        const user = await createSupabaseRepositories().session.getCurrentUser();
        if (version !== authRequestVersion.current) return;
        setCurrentUser(user);
        if (user) setRole(user.role);
        setAuthBootstrapState(user ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        if (version !== authRequestVersion.current) return;
        setAuthError(error instanceof Error ? error.message : String(error));
        setAuthBootstrapState('error');
        throw error;
      }
    },
  }), [authBootstrapState, authError, barbers, bookings, bookingError, bookingLoading, catalogError, catalogLoading, currentUser, hydrated, listAvailability, listServices, messages, persistenceError, preferences, role, studios]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}

export type { AppStore, Booking, BookingStatus, Role };
