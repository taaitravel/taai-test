const TIME_ZONE = /^[A-Za-z0-9_+\/-]{1,64}$/;

export const resolveTimeZone = (value: unknown): string => {
  if (typeof value !== 'string' || !TIME_ZONE.test(value)) return 'America/New_York';
  try {
    Intl.DateTimeFormat('en-CA', { timeZone: value }).format(new Date());
    return value;
  } catch {
    return 'America/New_York';
  }
};

/** YYYY-MM-DD in the traveler's zone, defaulting to America/New_York. */
export const todayPrompt = (timeZone: unknown, now = new Date()): string => {
  const zone = resolveTimeZone(timeZone);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return `# Today
Today is ${today} (${zone}). Resolve relative and month-only dates to the NEXT future occurrence. If a month is given without days, pick a sensible default (for example 4 nights starting the second Friday), state the assumption in one line, and search.`;
};
