import { format } from 'date-fns';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const asDateOnly = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().slice(0, 10);
  if (!DATE_ONLY_PATTERN.test(candidate)) return null;
  const [year, month, day] = candidate.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) return null;
  return candidate;
};

/** Parse a calendar date in the viewer's local calendar, never as a UTC instant. */
export const parseDateOnly = (value: unknown): Date | null => {
  const dateOnly = asDateOnly(value);
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

export const formatDateOnly = (value: unknown, pattern = 'MMM d, yyyy'): string | null => {
  const parsed = parseDateOnly(value);
  return parsed ? format(parsed, pattern) : null;
};

export const formatDateOnlyRange = (
  startValue: unknown,
  endValue: unknown,
  startPattern = 'MMM d',
  endPattern = 'MMM d, yyyy',
): string | null => {
  const end = formatDateOnly(endValue, endPattern);
  const start = formatDateOnly(startValue, end ? startPattern : endPattern);
  if (!start) return null;
  return end ? `${start} – ${end}` : start;
};

export const compareDateOnly = (left: unknown, right: unknown): number => {
  const a = asDateOnly(left);
  const b = asDateOnly(right);
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a.localeCompare(b);
};

export const localDateOnlyFromDate = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const differenceInDateOnlyDays = (startValue: unknown, endValue: unknown): number => {
  const start = asDateOnly(startValue);
  const end = asDateOnly(endValue);
  if (!start || !end) return 0;
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  return Math.max(0, Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000));
};

export const getViewerTimezone = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

export const isValidTimezone = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

export const formatInstantInTimezone = (
  value: unknown,
  timeZone?: string | null,
  options: Intl.DateTimeFormatOptions = {},
): string | null => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const zone = isValidTimezone(timeZone) ? timeZone : undefined;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...options,
    ...(zone ? { timeZone: zone } : {}),
  }).format(date);
};

export interface DualTimeDisplay {
  service: string | null;
  viewer: string | null;
  serviceTimezone: string | null;
  viewerTimezone: string | null;
}

export const formatDualTime = (
  utcValue: unknown,
  serviceTimezone?: string | null,
  viewerTimezone = getViewerTimezone(),
): DualTimeDisplay => {
  const validServiceZone = isValidTimezone(serviceTimezone) ? serviceTimezone : null;
  const validViewerZone = isValidTimezone(viewerTimezone) ? viewerTimezone : null;
  return {
    service: formatInstantInTimezone(utcValue, validServiceZone),
    viewer: validViewerZone && validServiceZone && validViewerZone !== validServiceZone
      ? formatInstantInTimezone(utcValue, validViewerZone)
      : null,
    serviceTimezone: validServiceZone,
    viewerTimezone: validViewerZone,
  };
};
