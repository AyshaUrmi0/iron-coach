const MS_PER_DAY = 86_400_000;
const DATE_LENGTH = "YYYY-MM-DD".length;

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

/** The "YYYY-MM-DD" date at a given moment in an IANA timezone. */
export function dateInTimezone(moment: Date, timezone: string): string {
  // en-CA is the locale whose dates are written YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(moment);
}
