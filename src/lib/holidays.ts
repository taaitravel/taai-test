// Holiday detection utility for US major holidays

function getEasterDate(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getLastMondayInMay(year: number): number {
  const d = new Date(year, 4, 31); // May 31
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
  return d.getDate();
}

function getFirstMondayInSep(year: number): number {
  const d = new Date(year, 8, 1);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return d.getDate();
}

function getFourthThursdayInNov(year: number): number {
  const d = new Date(year, 10, 1);
  while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
  return d.getDate() + 21; // first Thu + 21 = 4th Thu
}

export function getHoliday(date: Date): string | null {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  const year = date.getFullYear();

  // Fixed-date holidays
  if (month === 0 && day === 1) return "New Year's Day";
  if (month === 1 && day === 14) return "Valentine's Day";
  if (month === 6 && day === 4) return "Independence Day";
  if (month === 9 && day === 31) return "Halloween";
  if (month === 11 && day === 24) return "Christmas Eve";
  if (month === 11 && day === 25) return "Christmas Day";
  if (month === 11 && day === 31) return "New Year's Eve";

  // Dynamic holidays
  const easter = getEasterDate(year);
  if (month === easter.getMonth() && day === easter.getDate()) return "Easter";

  if (month === 4 && day === getLastMondayInMay(year)) return "Memorial Day";
  if (month === 8 && day === getFirstMondayInSep(year)) return "Labor Day";

  const thanksgivingDay = getFourthThursdayInNov(year);
  if (month === 10 && day === thanksgivingDay) return "Thanksgiving";

  return null;
}

export function formatDateByPreference(date: Date, format: string): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  
  if (format === 'DD/MM/YY') return `${d}/${m}/${y}`;
  return `${m}/${d}/${y}`; // default MM/DD/YY
}

export function getAbbreviatedWeekday(date: Date): string {
  const days = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
  return days[date.getDay()];
}
