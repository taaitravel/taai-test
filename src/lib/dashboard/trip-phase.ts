import { asDateOnly, compareDateOnly, isValidTimezone } from '@/lib/date-time';

export type TripPhase = 'planning' | 'upcoming' | 'active' | 'completed';

export interface DatedTrip {
  itin_date_start?: string | null;
  itin_date_end?: string | null;
}

/**
 * Inclusive calendar classification.
 * Active means start <= today <= end on calendar dates, never on UTC instants.
 * A date-only value such as 2026-11-01 is not parsed with `new Date(string)`.
 */
export function classifyTripPhase(start: unknown, end: unknown, today: string): TripPhase {
  const todayDate = asDateOnly(today);
  const startDate = asDateOnly(start);
  const endDate = asDateOnly(end);
  if (!todayDate || !startDate || !endDate) return 'planning';
  if (compareDateOnly(todayDate, startDate) < 0) return 'upcoming';
  if (compareDateOnly(todayDate, endDate) > 0) return 'completed';
  return 'active';
}

/** Calendar date in an IANA zone. Returns null when the zone is not usable. */
export function calendarDateInTimeZone(instant: Date, timeZone: string): string | null {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) return null;
  if (!isValidTimezone(timeZone)) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

export interface ZonedPhase {
  phase: TripPhase;
  today: string | null;
  todaySource: 'destination' | 'viewer' | 'unavailable';
}

/**
 * Prefer the destination's calendar when a timezone is stored.
 * Trip rows do not store one today, so callers pass null and the viewer zone is used.
 */
export function classifyTripInZone(
  start: unknown,
  end: unknown,
  now: Date,
  destinationTimeZone: string | null | undefined,
  viewerTimeZone: string,
): ZonedPhase {
  const destination = isValidTimezone(destinationTimeZone) ? destinationTimeZone : null;
  const zone = destination ?? (isValidTimezone(viewerTimeZone) ? viewerTimeZone : null);
  if (!zone) return { phase: 'planning', today: null, todaySource: 'unavailable' };
  const today = calendarDateInTimeZone(now, zone);
  if (!today) return { phase: 'planning', today: null, todaySource: 'unavailable' };
  return {
    phase: classifyTripPhase(start, end, today),
    today,
    todaySource: destination ? 'destination' : 'viewer',
  };
}

export function partitionTrips<T extends DatedTrip>(trips: readonly T[], today: string) {
  const active: T[] = [];
  const upcoming: T[] = [];
  const planning: T[] = [];
  const completed: T[] = [];
  for (const trip of trips) {
    const phase = classifyTripPhase(trip.itin_date_start, trip.itin_date_end, today);
    if (phase === 'active') active.push(trip);
    else if (phase === 'upcoming') upcoming.push(trip);
    else if (phase === 'completed') completed.push(trip);
    else planning.push(trip);
  }
  const byStart = (left: T, right: T) => compareDateOnly(left.itin_date_start, right.itin_date_start);
  active.sort(byStart);
  upcoming.sort(byStart);
  planning.sort(byStart);
  completed.sort((left, right) => compareDateOnly(right.itin_date_start, left.itin_date_start));
  return { active, upcoming, planning, completed };
}

export function weekdayOfDateOnly(value: unknown): string | null {
  const date = asDateOnly(value);
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][utc.getUTCDay()] ?? null;
}
