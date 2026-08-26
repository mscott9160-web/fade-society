import { describe, expect, it } from 'vitest';
import { presentBookingStatus } from '../src/domain/booking-status';

describe('booking status presenter', () => {
  it.each(['pending', 'confirmed', 'declined', 'failed', 'cancelled', 'completed', 'no_show'] as const)('presents %s', (status) => {
    const presentation = presentBookingStatus(status);
    expect(presentation.label).toBeTruthy();
    expect(presentation.explanation).toBeTruthy();
    expect(presentation.tone).toBeTruthy();
    expect(presentation.category).toBeTruthy();
  });

  it('keeps no-show in history', () => {
    expect(presentBookingStatus('no_show')).toMatchObject({ label: 'No-show', category: 'history', tone: 'warning' });
  });
});