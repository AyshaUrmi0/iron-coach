import type { RoastLevel } from "./state.js";

export const LANGUAGES = ["en"] as const;

export type Language = (typeof LANGUAGES)[number];

export interface RoastVars {
  readonly name: string;
  readonly days: number;
  readonly muscle: string;
}

// {days} appears only where skipDays is above 0 (annoyed to nuclear).
// {muscle} appears only right after a check-in (hype and comeback); new users have none.
export const ROAST_BANK: Readonly<Record<RoastLevel, Readonly<Record<Language, readonly string[]>>>> = {
  hype: {
    en: [
      "THAT'S what I'm talking about, {name}! {muscle} day DONE. Again tomorrow.",
      "{muscle} just got hit so hard it's writing a complaint. Hell yes, {name}!",
      "Look at you, {name}, actually doing the damn work. {muscle} is DONE. Don't get cocky.",
      "YES! No excuses, no bullshit, just {muscle}. That's how it's done, {name}!",
      "{name} showed up! Alert the whole gym! {muscle} day is in the books!",
      "One more in the bank, {name}. {muscle} done, excuses zero. Keep that damn scoreboard moving.",
    ],
  },
  rest: {
    en: [
      "Rest day. Enjoy it. Tomorrow your ass is back under that bar.",
      "Day off, {name}. Not a week off. Don't get creative.",
      "Rest is part of the plan. Couch marathons are not. Be ready tomorrow.",
      "Relax today, {name}. The bar isn't going anywhere, and neither are your excuses.",
      "Easy day. Stretch, sleep, drink some damn water. Then back to work.",
      "You get today, {name}. Tomorrow belongs to the iron.",
    ],
  },
  annoyed: {
    en: [
      "One day off. ONE. Don't you dare make it two.",
      "You missed a day, {name}. I noticed. The squat rack noticed too.",
      "{days} skipped day and I already smell an excuse. Save it for someone who cares.",
      "Busy, {name}? Hell, everybody's busy. Get to the gym today.",
      "Yesterday was free. Today costs you. Go.",
      "That's your one free pass, {name}. Gym. Today. No damn speeches.",
    ],
  },
  angry: {
    en: [
      "Two days, {name}? Your dumbbells are collecting dust and your excuses are collecting interest.",
      "{days} days of bullshit excuses. I've heard better ones from a broken treadmill.",
      "What's the story today, {name}? Too tired? Too busy? Too damn comfortable? Pick one, then go anyway.",
      "{days} days gone. The bench asked about you. I told it not to get its hopes up.",
      "Your gym bag has been sitting there packed for {days} days, {name}. Pick it up.",
      "Hell no, {name}. {days} days is how quitting starts. Move your ass.",
    ],
  },
  savage: {
    en: [
      "{days} days. Your biceps filed a missing person report. Get your lazy ass up.",
      "{days} days, {name}! The gym staff think you were a rumor.",
      "Your excuses have better attendance than you do, {name}. {days} straight days of it.",
      "{days} days on the couch and you call that a recovery plan? That's bullshit and you know it.",
      "Your gym shoes think you moved away, {name}. {days} days. Go prove them wrong.",
      "Hey {name}, {days} days ago you had discipline. Anybody seen it? Get your lazy ass out the door.",
    ],
  },
  nuclear: {
    en: [
      "I'm not even mad anymore. I'm DISAPPOINTED. Your muscles packed their bags. Go win them back.",
      "{days} DAYS, {name}! I have screamed at walls that showed more commitment!",
      "{days} days! The weights held a meeting and voted you OUT. Get down there and appeal, you lazy ass!",
      "Historians will study these {days} days, {name}. The Great Laziness. Textbooks. Documentaries. GET UP.",
      "I've run out of damn words, {name}. {days} days. I'm apologizing to the squat rack on your behalf.",
      "{days} days of bullshit! This is the loudest I've ever yelled, and I once yelled at a fire alarm. GO. TO. THE. GYM.",
    ],
  },
  comeback: {
    en: [
      "Look who crawled back. Good. Now earn it.",
      "Well, hell. {name} remembered where the gym is. {muscle} today, consistency tomorrow.",
      "You're back, {name}. I'm not clapping yet. Do it again and maybe I'll nod.",
      "So the excuses ran out? Good. {muscle} is a start. Now don't you damn disappear again.",
      "Back from your little vacation, {name}? {muscle} done. The debt is still unpaid.",
      "About damn time, {name}. One check-in doesn't fix it. The next ten might.",
    ],
  },
};

/** Fills {name}, {days} and {muscle}. Replacer functions keep "$" in a user's name literal. */
export function fillRoast(template: string, vars: RoastVars): string {
  return template
    .replaceAll("{name}", () => vars.name)
    .replaceAll("{days}", () => String(vars.days))
    .replaceAll("{muscle}", () => vars.muscle);
}

export function pickRoast(level: RoastLevel, language: Language, vars: RoastVars): string {
  const lines = ROAST_BANK[level][language];
  return fillRoast(lines[Math.floor(Math.random() * lines.length)], vars);
}
