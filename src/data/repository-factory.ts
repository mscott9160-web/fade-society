import type { BookingRepository, CatalogRepository, MessageRepository, SessionRepository } from './repositories';
import { createSupabaseBookingRepository } from './supabase-booking-repository';
import { createSupabaseCatalogRepository } from './supabase-catalog-repository';
import { createSupabaseSessionRepository } from './supabase-session-repository';
import { createSupabaseMessageRepository } from './supabase-message-repository';

export type AppRepositories = {
  booking: BookingRepository;
  catalog: CatalogRepository;
  session: SessionRepository;
  message: MessageRepository;
};

export function createSupabaseRepositories(): AppRepositories {
  return {
    booking: createSupabaseBookingRepository(),
    catalog: createSupabaseCatalogRepository(),
    session: createSupabaseSessionRepository(),
    message: createSupabaseMessageRepository(),
  };
}