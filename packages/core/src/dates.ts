const MS_PER_DAY = 86_400_000;

function toDayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  // UTC so daylight-saving changes can never make a day 23 or 25 hours long.
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** Whole days from one "YYYY-MM-DD" date to another. */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}
