import type { BookingStatus } from '@/domain/models';

export type BookingStatusTone = 'positive' | 'informative' | 'warning' | 'negative' | 'neutral';

export type BookingStatusPresentation = {
  label: string;
  explanation: string;
  tone: BookingStatusTone;
  category: 'active' | 'attention' | 'history';
};

const presentations: Record<BookingStatus, BookingStatusPresentation> = {
  pending: { label: 'Pending', explanation: 'Waiting for the studio to confirm availability.', tone: 'informative', category: 'active' },
  confirmed: { label: 'Confirmed', explanation: 'Your appointment is confirmed.', tone: 'positive', category: 'active' },
  declined: { label: 'Declined', explanation: 'The studio could not accept this appointment request.', tone: 'negative', category: 'attention' },
  failed: { label: 'Could not book', explanation: 'We could not complete this appointment request.', tone: 'negative', category: 'attention' },
  cancelled: { label: 'Cancelled', explanation: 'This appointment is cancelled.', tone: 'neutral', category: 'history' },
  completed: { label: 'Completed', explanation: 'This appointment is complete.', tone: 'positive', category: 'history' },
  no_show: { label: 'No-show', explanation: 'This appointment was marked as a no-show.', tone: 'warning', category: 'history' },
};

export function presentBookingStatus(status: BookingStatus): BookingStatusPresentation {
  return presentations[status];
}