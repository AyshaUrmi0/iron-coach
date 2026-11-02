/* eslint-disable ts-patterns/no-magic-numbers -- test inputs read best as plain numbers */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fillRoast, LANGUAGES, pickRoast, ROAST_BANK, type RoastVars } from "./roasts.js";
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
const LINES_PER_LEVEL = 6;
const VARS: RoastVars = { name: "Rafi", days: 4, muscle: "CHEST" };

const ALL_LINES = LEVELS.flatMap((level) =>
  LANGUAGES.flatMap((language) => ROAST_BANK[level][language].map((line) => ({ level, language, line }))),
);

// Small on purpose: a safety net for slips, not a replacement for reading the lines.
const BANNED_WORDS = new Set([
  // weight, body, looks
  "fat", "fatty", "skinny", "ugly", "chubby", "obese", "flabby", "belly",
  // family
  "mom", "mother", "dad", "father", "sister",
  // slurs and harsher abuse
  "bitch", "slut", "whore", "retard",
  // sexual
  "sex", "fuck",
  // threats, death, self-harm
  "kill", "die", "dead", "suicide",
  // religion, gender
  "god", "allah", "jesus", "hindu", "muslim", "girl", "sissy",
]);

function bannedWordsIn(text: string): string[] {
  const words = new Intl.Segmenter(undefined, { granularity: "word" }).segment(text.toLowerCase());
  return [...words]
    .filter(({ isWordLike, segment }) => isWordLike && BANNED_WORDS.has(segment))
    .map(({ segment }) => segment);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ROAST_BANK", () => {
  it.each(LEVELS.flatMap((level) => LANGUAGES.map((language) => ({ level, language }))))(
    "$level/$language has 6 different lines",
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

  it("uses {muscle} only right after a check-in", () => {
    const afterCheckin: readonly RoastLevel[] = ["hype", "comeback"];
    const misused = ALL_LINES.filter(
      ({ level, line }) => !afterCheckin.includes(level) && line.includes("{muscle}"),
    );
    expect(misused).toEqual([]);
  });

  it("contains no banned words", () => {
    const hits = ALL_LINES.filter(({ line }) => bannedWordsIn(line).length);
    expect(hits).toEqual([]);
  });
});

describe("bannedWordsIn", () => {
  it.each([
    ["You fat slacker", ["fat"]],
    ["Ask your MOTHER", ["mother"]],
  ])("catches %s", (text, found) => {
    expect(bannedWordsIn(text)).toEqual(found);
  });

  it.each(["Your ass is lazy, damn it", "Fatigue is no excuse"])(
    "allows %s",
    (text) => {
      expect(bannedWordsIn(text)).toEqual([]);
    },
  );
});

describe("fillRoast", () => {
  it("fills repeated placeholders", () => {
    expect(fillRoast("{name} {name}: {days} days, {muscle}", VARS)).toBe("Rafi Rafi: 4 days, CHEST");
  });

  it("keeps special characters in a name literal", () => {
    expect(fillRoast("Hi {name}!", { ...VARS, name: "$& $1" })).toBe("Hi $& $1!");
  });
});

describe("pickRoast", () => {
  it.each([
    [0, 0],
    [0.5, 3],
    [0.999, 5],
  ])("with random %f picks line %i", (random, index) => {
    vi.spyOn(Math, "random").mockReturnValue(random);
    expect(pickRoast("savage", "en", VARS)).toBe(fillRoast(ROAST_BANK.savage.en[index], VARS));
  });

  it("uses the requested level and language", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickRoast("nuclear", "en", VARS)).toBe(fillRoast(ROAST_BANK.nuclear.en[0], VARS));
  });
});
