export function formatBookingDate(startsAt: string) {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function getLocalDateKey(startsAt: string | Date) {
  const date = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getRelativeDateLabel(startsAt: string | Date, now = new Date()) {
  const date = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOffset = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (dayOffset === 0) return 'Today';
  if (dayOffset === 1) return 'Tomorrow';
  return target.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export type DateTimeGroup = {
  date: string;
  label: string;
  times: { value: string; label: string }[];
};

export function groupBookingTimes(startsAtValues: string[]): DateTimeGroup[] {
  const groups = new Map<string, DateTimeGroup>();

  startsAtValues
    .map((value) => ({ value, date: new Date(value) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .forEach(({ value, date }) => {
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      let group = groups.get(dateKey);
      if (!group) {
        group = { date: dateKey, label: date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }), times: [] };
        groups.set(dateKey, group);
      }
      group.times.push({ value, label: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) });
    });

  return Array.from(groups.values());
}

export function makeSlotDate(dayOffset: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}
