import { describe, expect, it } from 'vitest';
import { groupBookingTimes } from '../src/domain/date';

describe('groupBookingTimes', () => {
  it('groups and orders supplied timestamps', () => {
    const result = groupBookingTimes(['2026-08-27T15:00:00.000Z', '2026-08-26T09:00:00.000Z', '2026-08-27T10:00:00.000Z']);
    expect(result).toHaveLength(2);
    expect(result.flatMap((group) => group.times.map((time) => time.value))).toEqual(['2026-08-26T09:00:00.000Z', '2026-08-27T10:00:00.000Z', '2026-08-27T15:00:00.000Z']);
    expect(result[0].times[0].label).toBe(new Date('2026-08-26T09:00:00.000Z').toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
  });

  it('omits invalid timestamps safely', () => {
    expect(groupBookingTimes(['invalid', '']).flatMap((group) => group.times)).toEqual([]);
  });
});