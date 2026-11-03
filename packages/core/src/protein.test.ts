/* eslint-disable ts-patterns/no-magic-numbers -- test inputs read best as plain numbers */
import { describe, expect, it } from "vitest";
import { hourInTimezone } from "./dates.js";
import { PROTEIN_ROASTS, proteinLevel, proteinRoast, proteinTotal } from "./protein.js";

describe("proteinTotal", () => {
  it("adds up the meals", () => {
    expect(proteinTotal([{ protein: 12 }, { protein: 30 }, { protein: 0 }])).toBe(42);
  });

  it("is 0 with no meals", () => {
    expect(proteinTotal([])).toBe(0);
  });
});

describe("proteinLevel", () => {
  it.each([
    [0, 100, 9, undefined],
    [99, 100, 17, undefined],
    [99, 100, 18, "short"],
    [0, 100, 23, "short"],
    [100, 100, 9, "hit"],
    [150, 100, 23, "hit"],
  ])("%i of %i at hour %i is %s", (total, goal, hour, level) => {
    expect(proteinLevel(total, goal, hour)).toBe(level);
  });
});

describe("PROTEIN_ROASTS", () => {
  it.each(["short", "hit"] as const)("%s has 8 different lines", (level) => {
    expect(new Set(PROTEIN_ROASTS.en[level]).size).toBe(8);
  });

  it("only uses {left} while there's still protein left", () => {
    expect(PROTEIN_ROASTS.en.short.every((line) => line.includes("{left}"))).toBe(true);
    expect(PROTEIN_ROASTS.en.hit.some((line) => line.includes("{left}"))).toBe(false);
  });
});

describe("proteinRoast", () => {
  const VARS = { name: "$& Rafi", left: 40 };

  it("fills in every placeholder, keeping special characters in a name", () => {
    for (let day = 1; day <= 31; day++) {
      const date = `2026-03-${String(day).padStart(2, "0")}`;
      const short = proteinRoast("short", "en", VARS, date);
      expect(short).not.toContain("{");
      expect(short).toContain("40");
      expect(proteinRoast("hit", "en", VARS, date)).not.toContain("{");
    }
    expect(proteinRoast("short", "en", VARS, "2026-03-02")).toContain("$& Rafi");
  });

  it("stays the same all day and changes the next day", () => {
    const today = proteinRoast("short", "en", VARS, "2026-03-05");
    expect(proteinRoast("short", "en", VARS, "2026-03-05")).toBe(today);
    expect(proteinRoast("short", "en", VARS, "2026-03-06")).not.toBe(today);
  });
});

describe("hourInTimezone", () => {
  it.each([
    ["2026-03-01T14:30:00Z", "Asia/Dhaka", 20],
    ["2026-03-01T18:00:00Z", "Asia/Dhaka", 0],
    ["2026-03-01T17:59:00Z", "Asia/Dhaka", 23],
    ["2026-03-01T14:30:00Z", "UTC", 14],
  ])("%s in %s is hour %i", (moment, timezone, hour) => {
    expect(hourInTimezone(new Date(moment), timezone)).toBe(hour);
  });
});
