import type { BookingRepository, CatalogRepository, SessionRepository } from './repositories';
import { createSupabaseBookingRepository } from './supabase-booking-repository';
import { createSupabaseCatalogRepository } from './supabase-catalog-repository';
import { createSupabaseSessionRepository } from './supabase-session-repository';

export type AppRepositories = {
  booking: BookingRepository;
  catalog: CatalogRepository;
  session: SessionRepository;
};

export function createSupabaseRepositories(): AppRepositories {
  return {
    booking: createSupabaseBookingRepository(),
    catalog: createSupabaseCatalogRepository(),
    session: createSupabaseSessionRepository(),
  };
}