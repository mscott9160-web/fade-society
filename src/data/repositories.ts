import type { AvailabilitySlot, Barber, Booking, Message, Role, Service, Studio, User } from '@/domain/models';

export type AuthCredentials = {
  email: string;
  password: string;
  displayName?: string;
};

export type AuthStateListener = (user: User | null, error?: Error) => void;

export type AuthResult = {
  user: User | null;
  requiresEmailConfirmation: boolean;
};

export type CreateBookingInput = {
  serviceId: string;
  barberId: string;
  startsAt: string;
};

export type BookingRepository = {
  listMine: (userId: string) => Promise<Booking[]>;
  getById?: (userId: string, bookingId: string) => Promise<Booking>;
  create: (userId: string, input: CreateBookingInput, idempotencyKey: string) => Promise<Booking>;
  reschedule: (userId: string, bookingId: string, startsAt: string) => Promise<Booking>;
  cancel: (userId: string, bookingId: string) => Promise<Booking>;
};

export type CatalogRepository = {
  listStudios: () => Promise<Studio[]>;
  listBarbers: (studioId?: string) => Promise<Barber[]>;
  listServices: (barberId: string) => Promise<Service[]>;
  listAvailability: (barberId: string, from: string, to: string) => Promise<AvailabilitySlot[]>;
};

export type MessageRepository = {
  listThreads: (userId: string) => Promise<Message[]>;
  send: (userId: string, participantId: string, body: string, idempotencyKey: string) => Promise<Message>;
  markRead: (userId: string, participantId: string) => Promise<void>;
};

export type SessionRepository = {
  getCurrentUser: () => Promise<User | null>;
  subscribeToAuthState: (listener: AuthStateListener) => () => void;
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateRoleForDemo: (role: Role) => Promise<User>;
};
