/* eslint-disable ts-patterns/no-magic-numbers -- test inputs read best as plain numbers */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BANK_LANGUAGES,
  fillRoast,
  LANGUAGES,
  pickProcrastinationRoast,
  pickRoast,
  PROCRASTINATION_ROASTS,
  ROAST_BANK,
  sampleRoasts,
  type RoastVars,
} from "./roasts.js";
import type { RoastLevel } from "./state.js";

const LEVELS: readonly RoastLevel[] = [
  "hype",
  "rest",
  "annoyed",
  "angry",
  "savage",
  "nuclear",
  "comeback",
];
const LINES_PER_LEVEL = 8;
const VARS: RoastVars = { name: "Rafi", days: 4, muscle: "CHEST" };

const ALL_LINES = LEVELS.flatMap((level) =>
  BANK_LANGUAGES.flatMap((language) => ROAST_BANK[level][language].map((line) => ({ level, language, line }))),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ROAST_BANK", () => {
  it.each(LEVELS.flatMap((level) => BANK_LANGUAGES.map((language) => ({ level, language }))))(
    "$level/$language has 8 different lines",
    ({ level, language }) => {
      const lines = ROAST_BANK[level][language];
      expect(lines).toHaveLength(LINES_PER_LEVEL);
      expect(new Set(lines).size).toBe(LINES_PER_LEVEL);
    },
  );

  it("fills every template completely", () => {
    ALL_LINES.forEach(({ line }) => {
      const filled = fillRoast(line, VARS);
      expect(filled).not.toContain("{");
      expect(filled).not.toContain("}");
      if (line.includes("{name}")) expect(filled).toContain(VARS.name);
      if (line.includes("{days}")) expect(filled).toContain(String(VARS.days));
      if (line.includes("{muscle}")) expect(filled).toContain(VARS.muscle);
    });
  });

  it("uses {days} only when skipDays is above 0", () => {
    const zeroDayLevels: readonly RoastLevel[] = ["hype", "rest", "comeback"];
    const misused = ALL_LINES.filter(
      ({ level, line }) => zeroDayLevels.includes(level) && line.includes("{days}"),
    );
    expect(misused).toEqual([]);
  });
});

describe("fillRoast", () => {
  it("fills repeated placeholders", () => {
    expect(fillRoast("{name} {name}: {days} days, {muscle}", VARS)).toBe("Rafi Rafi: 4 days, CHEST");
  });

  it("keeps special characters in a name literal", () => {
    expect(fillRoast("Hi {name}!", { ...VARS, name: "$& $1" })).toBe("Hi $& $1!");
  });
});

describe("LANGUAGES", () => {
  it("offers only English for now", () => {
    expect(LANGUAGES).toEqual(["en"]);
  });
});

describe("sampleRoasts", () => {
  it.each(LANGUAGES)("gives different lines from the %s bank", (language) => {
    const lines = sampleRoasts("savage", language, 6);
    expect(lines).toHaveLength(6);
    expect(new Set(lines).size).toBe(6);
    lines.forEach((line) => expect(ROAST_BANK.savage[language]).toContain(line));
  });
});

describe("pickProcrastinationRoast", () => {
  it("has 20 different lines, none needing skip days or a muscle", () => {
    const lines = PROCRASTINATION_ROASTS.en;
    expect(new Set(lines).size).toBe(20);
    lines.forEach((line) => expect(line).not.toMatch(/\{(days|muscle)\}/));
  });

  it("fills in the name", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(PROCRASTINATION_ROASTS.en[0]).toContain("{name}");
    const line = pickProcrastinationRoast("en", "Rafi");
    expect(line).toContain("Rafi");
    expect(line).not.toContain("{name}");
  });

  it("never repeats the line shown last", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const first = pickProcrastinationRoast("en", "Rafi");
    expect(pickProcrastinationRoast("en", "Rafi", first)).not.toBe(first);
  });
});

describe("pickRoast", () => {
  it.each([
    [0, 0],
    [0.5, 4],
    [0.999, 7],
  ])("with random %f picks line %i", (random, index) => {
    vi.spyOn(Math, "random").mockReturnValue(random);
    expect(pickRoast("savage", "en", VARS)).toBe(fillRoast(ROAST_BANK.savage.en[index], VARS));
  });

  it("uses the requested level and language", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickRoast("nuclear", "en", VARS)).toBe(fillRoast(ROAST_BANK.nuclear.en[0], VARS));
  });
});
