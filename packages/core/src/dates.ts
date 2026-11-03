const MS_PER_DAY = 86_400_000;
const DATE_LENGTH = "YYYY-MM-DD".length;
const MONTH_LENGTH = "YYYY-MM".length;

function toDayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  // UTC so daylight-saving changes can never make a day 23 or 25 hours long.
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** Whole days from one "YYYY-MM-DD" date to another. */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** The "YYYY-MM-DD" date a number of days after another. Negative goes back. */
export function addDays(date: string, days: number): string {
  return new Date((toDayNumber(date) + days) * MS_PER_DAY).toISOString().slice(0, DATE_LENGTH);
}

/** The "YYYY-MM" month a number of months after another. Negative goes back. */
export function addMonths(month: string, months: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + months, 1)).toISOString().slice(0, MONTH_LENGTH);
}

/** Every "YYYY-MM-DD" date in a "YYYY-MM" month. */
export function datesInMonth(month: string): string[] {
  const first = `${month}-01`;
  const days = daysBetween(first, `${addMonths(month, 1)}-01`);
  return Array.from({ length: days }, (_, index) => addDays(first, index));
}

/** 0 is Sunday, 6 is Saturday. */
export function weekdayOf(date: string): number {
  return new Date(toDayNumber(date) * MS_PER_DAY).getUTCDay();
}

/** The hour, 0 to 23, at a given moment in an IANA timezone. */
export function hourInTimezone(moment: Date, timezone: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(moment));
}

/** The "YYYY-MM-DD" date at a given moment in an IANA timezone. */
export function dateInTimezone(moment: Date, timezone: string): string {
  // en-CA is the locale whose dates are written YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(moment);
}
