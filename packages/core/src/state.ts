import { daysBetween } from "./dates.js";

export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "arms", "core", "legs"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type Muscles = Readonly<Record<MuscleGroup, number>>;
export type Title = "Noodle" | "Gym Rookie" | "Lifter" | "Beast" | "Iron Legend";
export type RoastLevel =
  | "hype"
  | "rest"
  | "annoyed"
  | "angry"
  | "savage"
  | "nuclear"
  | "comeback";

export type AvatarMood = "hype" | "normal" | "slump" | "nuclear";

export interface Checkin {
  readonly date: string;
  readonly muscles: readonly MuscleGroup[];
}

export interface State {
  readonly muscles: Muscles;
  readonly average: number;
  readonly title: Title;
  readonly streak: number;
  readonly skipDays: number;
  readonly roastLevel: RoastLevel;
  readonly checkedInToday: boolean;
}

interface Progress {
  readonly muscles: Muscles;
  readonly streak: number;
  readonly lastDate: string | undefined;
  readonly skipsBeforeLastCheckin: number;
}

/* eslint-disable ts-patterns/no-magic-numbers -- this table is where the goal and rest values are named */
const ALLOWED_REST: Readonly<Record<number, number | undefined>> = {
  2: 3,
  3: 2,
  4: 1,
  5: 1,
  6: 1,
  7: 0,
};
/* eslint-enable ts-patterns/no-magic-numbers */

const START_SCORE = 20;
const MIN_SCORE = 10;
const MAX_SCORE = 100;
const TRAINED_GAIN = 6;
const UNTRAINED_GAIN = 1;
const SKIP_LOSS = 2;
const STREAK_BONUS_EVERY = 7;
const STREAK_BONUS = 3;

const GYM_ROOKIE_MIN = 25;
const LIFTER_MIN = 45;
const BEAST_MIN = 65;
const IRON_LEGEND_MIN = 85;

const ANNOYED_SKIPS = 1;
const ANGRY_SKIPS = 2;
const SAVAGE_MAX_SKIPS = 4;
const SLUMP_MIN_SKIPS = 3;
const NUCLEAR_MIN_SKIPS = 5;

const START_MUSCLES: Muscles = {
  chest: START_SCORE,
  back: START_SCORE,
  shoulders: START_SCORE,
  arms: START_SCORE,
  core: START_SCORE,
  legs: START_SCORE,
};

function allowedRest(weeklyGoal: number): number {
  const rest = ALLOWED_REST[weeklyGoal];
  // Explicit check: 0 is a valid answer (goal 7 allows no rest).
  if (rest === undefined) throw new RangeError(`weeklyGoal must be 2-7, got ${weeklyGoal}`);
  return rest;
}

function skipsBetween(from: string, to: string, rest: number): number {
  return Math.max(0, daysBetween(from, to) - 1 - rest);
}

function mapMuscles(
  muscles: Muscles,
  change: (score: number, group: MuscleGroup) => number,
): Muscles {
  return MUSCLE_GROUPS.reduce<Muscles>(
    (next, group) => ({ ...next, [group]: change(muscles[group], group) }),
    muscles,
  );
}

function decay(muscles: Muscles, skips: number): Muscles {
  return mapMuscles(muscles, (score) => Math.max(MIN_SCORE, score - SKIP_LOSS * skips));
}

function gain(score: number, amount: number): number {
  return Math.min(MAX_SCORE, score + amount);
}

export interface MuscleGain {
  readonly muscle: MuscleGroup;
  readonly gain: number;
}

/** What each trained muscle really gained. A muscle already at the cap gained nothing, so it's left out. */
export function trainedGains(
  before: Muscles,
  after: Muscles,
  trained: readonly MuscleGroup[],
): readonly MuscleGain[] {
  return trained
    .map((muscle) => ({ muscle, gain: after[muscle] - before[muscle] }))
    .filter(({ gain }) => gain > 0);
}

export function moodFor({ checkedInToday, skipDays }: State): AvatarMood {
  if (checkedInToday) return "hype";
  if (skipDays >= NUCLEAR_MIN_SKIPS) return "nuclear";
  return skipDays >= SLUMP_MIN_SKIPS ? "slump" : "normal";
}

export function titleFor(average: number): Title {
  if (average < GYM_ROOKIE_MIN) return "Noodle";
  if (average < LIFTER_MIN) return "Gym Rookie";
  if (average < BEAST_MIN) return "Lifter";
  if (average < IRON_LEGEND_MIN) return "Beast";
  return "Iron Legend";
}

function roastLevelFor(
  checkedInToday: boolean,
  skipsBeforeLastCheckin: number,
  skipDays: number,
): RoastLevel {
  if (checkedInToday) return skipsBeforeLastCheckin ? "comeback" : "hype";
  if (!skipDays) return "rest";
  if (skipDays === ANNOYED_SKIPS) return "annoyed";
  if (skipDays === ANGRY_SKIPS) return "angry";
  if (skipDays <= SAVAGE_MAX_SKIPS) return "savage";
  return "nuclear";
}

function replayCheckin(progress: Progress, checkin: Checkin, rest: number): Progress {
  const skips = progress.lastDate ? skipsBetween(progress.lastDate, checkin.date, rest) : 0;
  const streak = skips ? 1 : progress.streak + 1;
  const trained = mapMuscles(decay(progress.muscles, skips), (score, group) =>
    gain(score, checkin.muscles.includes(group) ? TRAINED_GAIN : UNTRAINED_GAIN),
  );
  const muscles =
    streak % STREAK_BONUS_EVERY
      ? trained
      : mapMuscles(trained, (score) => gain(score, STREAK_BONUS));
  return { muscles, streak, lastDate: checkin.date, skipsBeforeLastCheckin: skips };
}

/** Rebuilds the whole state from the check-in history. `today` is "YYYY-MM-DD". */
export function computeState(
  checkins: readonly Checkin[],
  weeklyGoal: number,
  today: string,
): State {
  const rest = allowedRest(weeklyGoal);
  const start: Progress = {
    muscles: START_MUSCLES,
    streak: 0,
    lastDate: undefined,
    skipsBeforeLastCheckin: 0,
  };
  const { streak, lastDate, skipsBeforeLastCheckin, muscles: replayed } = checkins
    // Dates after today are ignored so the dev-only fake date can look back in time.
    .filter((checkin) => checkin.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    // Max one check-in per day.
    .filter((checkin, index, sorted) => checkin.date !== sorted[index - 1]?.date)
    .reduce((progress, checkin) => replayCheckin(progress, checkin, rest), start);

  const skipDays = lastDate ? skipsBetween(lastDate, today, rest) : 0;
  const muscles = decay(replayed, skipDays);
  const checkedInToday = lastDate === today;
  const average =
    MUSCLE_GROUPS.reduce((sum, group) => sum + muscles[group], 0) / MUSCLE_GROUPS.length;

  return {
    muscles,
    average,
    title: titleFor(average),
    // Once rest is overrun the next check-in restarts at 1, so the streak is already lost.
    streak: skipDays ? 0 : streak,
    skipDays,
    roastLevel: roastLevelFor(checkedInToday, skipsBeforeLastCheckin, skipDays),
    checkedInToday,
  };
}
