/* eslint-disable ts-patterns/no-magic-numbers -- calendar facts read best as plain numbers */
import { describe, expect, it } from "vitest";
import { addMonths, datesInMonth, weekdayOf } from "./dates.js";

describe("addMonths", () => {
  it.each([
    ["2026-03", 1, "2026-04"],
    ["2026-12", 1, "2027-01"],
    ["2026-01", -1, "2025-12"],
  ])("%s plus %i is %s", (month, months, expected) => {
    expect(addMonths(month, months)).toBe(expected);
  });
});

describe("datesInMonth", () => {
  it.each([
    ["2026-03", 31],
    ["2026-04", 30],
    ["2026-02", 28],
    ["2028-02", 29],
    ["2026-12", 31],
  ])("%s has %i days, in order", (month, days) => {
    const dates = datesInMonth(month);
    expect(dates).toHaveLength(days);
    expect(dates[0]).toBe(`${month}-01`);
    expect(dates.at(-1)).toBe(`${month}-${days}`);
  });
});

describe("weekdayOf", () => {
  it.each([
    ["2026-03-01", 0],
    ["2026-03-07", 6],
    ["2026-11-03", 2],
  ])("%s is weekday %i", (date, weekday) => {
    expect(weekdayOf(date)).toBe(weekday);
  });
});
