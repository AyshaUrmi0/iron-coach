import type { Language } from "./roasts.js";

export const MAX_MEAL_NAME_LENGTH = 60;
export const MAX_MEAL_PROTEIN = 300;
export const MIN_PROTEIN_GOAL = 20;
export const MAX_PROTEIN_GOAL = 500;

const EVENING_HOUR = 18;
const DAY_START = "YYYY-MM-".length;

export type ProteinLevel = "short" | "hit";

// {left} is only in "short", because nothing is left once the goal is hit.
export const PROTEIN_ROASTS: Readonly<Record<Language, Readonly<Record<ProteinLevel, readonly string[]>>>> = {
  en: {
    short: [
      "{left} g of protein left and the day is nearly over, {name}. Get some fucking food in you.",
      "Muscles don't grow on excuses, {name}. {left} g to go. Eat.",
      "All that talk and you're {left} g short, {name}. Eggs exist. Chicken exists. Move, dumbass.",
      "{left} g short, you lazy a**hole. The fridge is ten steps away, and even you can make it.",
      "It's evening and you're {left} g behind. What's the plan, {name}? More bullshit, or actual protein?",
      "Skipping protein is skipping the gym with a fork, you useless d**khead. {left} g. Go.",
      "{name}, you set that goal yourself and you're {left} g short. Who are you lying to now?",
      "Tomorrow's gains get built tonight. You're {left} g short, you piece of sh*t. Fix it.",
    ],
    hit: [
      "Goal smashed, {name}! That's how you fucking feed a machine.",
      "Protein done! No excuses, no bullshit. Now get some sleep, beast.",
      "Hell yes, {name}! You said you'd hit it and you hit it. Do it again tomorrow.",
      "That's my damn lifter. Goal hit. Your muscles say thanks, {name}.",
      "Look at you, eating like you mean it. Killer work, {name}.",
      "Every gram counted today, {name}. Unstoppable.",
      "You mad son of a b***h, you actually hit it. Same again tomorrow.",
      "Protein: DESTROYED. That's a promise kept, {name}. Hell yes!",
    ],
  },
};

export function proteinTotal(meals: readonly { readonly protein: number }[]): number {
  return meals.reduce((sum, { protein }) => sum + protein, 0);
}

/** "hit" once the goal is reached. "short" from the evening on. Before that the coach stays quiet. */
export function proteinLevel(total: number, goal: number, hour: number): ProteinLevel | undefined {
  if (total >= goal) return "hit";
  return hour >= EVENING_HOUR ? "short" : undefined;
}

/** Picked by the day of the month, so the line stays put all day instead of changing on every render. */
export function proteinRoast(
  level: ProteinLevel,
  language: Language,
  vars: { readonly name: string; readonly left: number },
  date: string,
): string {
  const lines = PROTEIN_ROASTS[language][level];
  return lines[Number(date.slice(DAY_START)) % lines.length]
    .replaceAll("{name}", () => vars.name)
    .replaceAll("{left}", () => String(vars.left));
}
