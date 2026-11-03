/* eslint-disable ts-patterns/no-magic-numbers -- hand-worked expected scores read best as plain numbers */
import { describe, expect, it } from "vitest";
import { addDays, dateInTimezone, daysBetween } from "./dates.js";
import { AVATAR_FRAMES, averageScore, avatarFrame, computeState, moodFor, startBodyFrame, titleFor, trainedGains, weakestMuscle, type Checkin, type MuscleGroup, type Muscles } from "./state.js";

/** Date string n days after 2026-01-01. */
const d = (n: number): string => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);

/** A number of check-ins spaced `every` days apart, starting at day 0. */
const checkins = (count: number, every: number, muscle: MuscleGroup = "chest"): Checkin[] =>
  Array.from({ length: count }, (_, i) => ({ date: d(i * every), muscles: [muscle] }));

/** Expected scores when one group differs from the other five. */
const scores = (group: MuscleGroup, score: number, others: number): Muscles => ({
  chest: others,
  back: others,
  shoulders: others,
  arms: others,
  core: others,
  legs: others,
  [group]: score,
});

describe("daysBetween", () => {
  it.each([
    ["2026-01-01", "2026-01-01", 0],
    ["2026-01-31", "2026-02-01", 1],
    ["2026-12-31", "2027-01-01", 1],
    ["2028-02-28", "2028-03-01", 2], // leap year
    ["2026-02-28", "2026-03-01", 1],
    ["2026-03-05", "2026-03-01", -4],
  ])("%s to %s is %i days", (from, to, days) => {
    expect(daysBetween(from, to)).toBe(days);
  });
});

describe("addDays", () => {
  it.each([
    ["2026-03-10", 0, "2026-03-10"],
    ["2026-03-10", -5, "2026-03-05"],
    ["2026-03-01", -1, "2026-02-28"],
    ["2028-03-01", -1, "2028-02-29"], // leap year
    ["2026-12-31", 1, "2027-01-01"],
  ])("%s plus %i is %s", (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });
});

describe("dateInTimezone", () => {
  it.each([
    ["2026-01-01T17:59:00Z", "Asia/Dhaka", "2026-01-01"],
    ["2026-01-01T18:00:00Z", "Asia/Dhaka", "2026-01-02"], // midnight in Dhaka, still Jan 1 in UTC
    ["2026-01-01T18:00:00Z", "UTC", "2026-01-01"],
    ["2026-12-31T18:30:00Z", "Asia/Dhaka", "2027-01-01"],
  ])("%s in %s is %s", (moment, timezone, date) => {
    expect(dateInTimezone(new Date(moment), timezone)).toBe(date);
  });
});

describe("new user", () => {
  it("starts everything at 20 with no streak and no skips", () => {
    expect(computeState([], 3, d(0))).toEqual({
      muscles: scores("chest", 20, 20),
      average: 20,
      title: "Noodle",
      streak: 0,
      skipDays: 0,
      roastLevel: "rest",
      checkedInToday: false,
    });
  });
});

describe("check-ins", () => {
  it("gives +6 to trained groups and +1 to the others", () => {
    const state = computeState([{ date: d(0), muscles: ["chest", "legs"] }], 3, d(0));
    expect(state.muscles).toEqual({ chest: 26, back: 21, shoulders: 21, arms: 21, core: 21, legs: 26 });
    expect(state.streak).toBe(1);
    expect(state.roastLevel).toBe("hype");
    expect(state.checkedInToday).toBe(true);
  });

  it("scores a perfect week, including the 7-streak bonus", () => {
    const state = computeState(checkins(7, 1), 7, d(6));
    expect(state.muscles).toEqual(scores("chest", 65, 30));
    expect(state.average).toBeCloseTo(215 / 6);
    expect(state.title).toBe("Gym Rookie");
    expect(state.streak).toBe(7);
    expect(state.skipDays).toBe(0);
    expect(state.roastLevel).toBe("hype");
  });

  it("counts only one check-in per day", () => {
    const state = computeState([...checkins(1, 1), ...checkins(1, 1)], 3, d(0));
    expect(state.muscles).toEqual(scores("chest", 26, 21));
    expect(state.streak).toBe(1);
  });

  it("handles unsorted history without changing the input", () => {
    const input = checkins(3, 1).reverse();
    const copy = [...input];
    expect(computeState(input, 7, d(2)).muscles).toEqual(scores("chest", 38, 23));
    expect(input).toEqual(copy);
  });

  it("ignores check-ins after today", () => {
    const state = computeState(checkins(3, 1), 7, d(0));
    expect(state.muscles).toEqual(scores("chest", 26, 21));
    expect(state.streak).toBe(1);
  });
});

describe("rest days", () => {
  it("does not punish an allowed rest day", () => {
    const state = computeState(checkins(1, 1), 5, d(2));
    expect(state.muscles).toEqual(scores("chest", 26, 21));
    expect(state.skipDays).toBe(0);
    expect(state.streak).toBe(1);
    expect(state.roastLevel).toBe("rest");
    expect(state.checkedInToday).toBe(false);
  });
});

describe("skipping", () => {
  // Goal 5 allows 1 rest day, so day 2 is the last free day and day 2 + n is n skip days.
  it.each([
    [1, "annoyed", 24, 19],
    [2, "angry", 22, 17],
    [3, "savage", 20, 15],
    [4, "savage", 18, 13],
    [5, "nuclear", 16, 11],
    [8, "nuclear", 10, 10],
  ])("%i skip days gives %s", (skipDays, roastLevel, chest, others) => {
    const state = computeState(checkins(1, 1), 5, d(2 + skipDays));
    expect(state.skipDays).toBe(skipDays);
    expect(state.roastLevel).toBe(roastLevel);
    expect(state.muscles).toEqual(scores("chest", chest, others));
    expect(state.streak).toBe(0);
  });

  it("applies decay between check-ins too", () => {
    const history: Checkin[] = [
      { date: d(0), muscles: ["chest"] },
      { date: d(5), muscles: ["legs"] }, // gap of 5 at 1 rest day = 3 skip days
    ];
    expect(computeState(history, 5, d(5)).muscles).toEqual({
      chest: 21,
      back: 16,
      shoulders: 16,
      arms: 16,
      core: 16,
      legs: 21,
    });
  });
});

describe("limits", () => {
  it("never drops a group below 10, each group separately", () => {
    expect(computeState(checkins(1, 1), 5, d(8)).muscles).toEqual(scores("chest", 14, 10));
    expect(computeState(checkins(1, 1), 5, d(1000)).muscles).toEqual(scores("chest", 10, 10));
  });

  it("never lifts a group above 100", () => {
    const state = computeState(checkins(100, 1), 7, d(99));
    expect(state.muscles).toEqual(scores("chest", 100, 100));
    expect(state.average).toBe(100);
    expect(state.title).toBe("Iron Legend");
  });
});

describe("streak bonus", () => {
  it("gives nothing at 6 check-ins", () => {
    expect(computeState(checkins(6, 2, "arms"), 5, d(10)).muscles).toEqual(scores("arms", 56, 26));
  });

  it("gives +3 at 7 check-ins, rest days included", () => {
    const state = computeState(checkins(7, 2, "arms"), 5, d(12));
    expect(state.muscles).toEqual(scores("arms", 65, 30));
    expect(state.streak).toBe(7);
  });

  it("gives it again at 14 check-ins", () => {
    const state = computeState(checkins(14, 2, "arms"), 5, d(26));
    expect(state.muscles).toEqual(scores("arms", 100, 40));
    expect(state.streak).toBe(14);
  });

  it("restarts the count after a skip, so no bonus at 7 total", () => {
    const history: Checkin[] = [...checkins(6, 1), { date: d(7), muscles: ["chest"] }];
    const state = computeState(history, 7, d(7));
    expect(state.streak).toBe(1);
    expect(state.muscles).toEqual(scores("chest", 60, 25));
  });
});

describe("comeback", () => {
  const history: Checkin[] = [
    { date: d(0), muscles: ["chest"] },
    { date: d(5), muscles: ["legs"] },
  ];

  it("fires on the first check-in after skipping", () => {
    const state = computeState(history, 5, d(5));
    expect(state.roastLevel).toBe("comeback");
    expect(state.streak).toBe(1);
    expect(state.skipDays).toBe(0);
  });

  it("is over by the next day", () => {
    expect(computeState(history, 5, d(6)).roastLevel).toBe("rest");
  });

  it("goes back to hype on the next check-in", () => {
    const next: Checkin[] = [...history, { date: d(6), muscles: ["arms"] }];
    const state = computeState(next, 5, d(6));
    expect(state.roastLevel).toBe("hype");
    expect(state.streak).toBe(2);
  });

  it("does not fire on the very first check-in", () => {
    expect(computeState(checkins(1, 1), 3, d(0)).roastLevel).toBe("hype");
  });
});

describe("every weeklyGoal", () => {
  it.each([
    [2, 3],
    [3, 2],
    [4, 1],
    [5, 1],
    [6, 1],
    [7, 0],
  ])("goal %i allows %i rest days", (goal, rest) => {
    const first = checkins(1, 1);
    expect(computeState(first, goal, d(rest + 1)).skipDays).toBe(0);
    expect(computeState(first, goal, d(rest + 2)).skipDays).toBe(1);

    // A gap at exactly the allowed rest keeps the streak; one day more breaks it.
    expect(computeState(checkins(2, rest + 1), goal, d(rest + 1)).streak).toBe(2);
    expect(computeState(checkins(2, rest + 2), goal, d(rest + 2)).streak).toBe(1);
  });

  it.each([0, 1, 8, 2.5, Number.NaN])("rejects goal %s", (goal) => {
    expect(() => computeState([], goal, d(0))).toThrow(RangeError);
  });
});

describe("moodFor", () => {
  const state = computeState([], 3, d(0));

  it.each([
    [0, "normal"],
    [2, "normal"],
    [3, "slump"],
    [4, "slump"],
    [5, "nuclear"],
    [8, "nuclear"],
  ] as const)("%i skip days is %s", (skipDays, mood) => {
    expect(moodFor({ ...state, skipDays, checkedInToday: false })).toBe(mood);
  });

  it("is hype after checking in today, whatever the skip days", () => {
    expect(moodFor({ ...state, skipDays: 8, checkedInToday: true })).toBe("hype");
  });
});

describe("trainedGains", () => {
  it("reports the real gain of a check-in on trained muscles only", () => {
    const before = computeState(checkins(1, 1), 7, d(0)).muscles;
    const after = computeState(checkins(2, 1), 7, d(1)).muscles;
    expect(trainedGains(before, after, ["chest"])).toEqual([{ muscle: "chest", gain: 6 }]);
  });

  it("includes the streak bonus", () => {
    const before = computeState(checkins(6, 1), 7, d(5)).muscles;
    const after = computeState(checkins(7, 1), 7, d(6)).muscles;
    expect(trainedGains(before, after, ["chest"])).toEqual([{ muscle: "chest", gain: 9 }]);
  });

  it("leaves out a muscle already at the cap", () => {
    const capped = scores("chest", 100, 50);
    expect(trainedGains(capped, capped, ["chest"])).toEqual([]);
  });
});

describe("weakestMuscle", () => {
  it("finds the lowest score", () => {
    expect(weakestMuscle(scores("legs", 12, 40))).toBe("legs");
  });

  it("picks the first group on a tie", () => {
    expect(weakestMuscle(scores("legs", 40, 40))).toBe("chest");
  });
});

describe("titleFor", () => {
  it.each([
    [10, "Noodle"],
    [24.99, "Noodle"],
    [25, "Gym Rookie"],
    [44.99, "Gym Rookie"],
    [45, "Lifter"],
    [64.99, "Lifter"],
    [65, "Beast"],
    [84.99, "Beast"],
    [85, "Iron Legend"],
    [100, "Iron Legend"],
  ])("average %f is %s", (average, title) => {
    expect(titleFor(average)).toBe(title);
  });
});

describe("avatarFrame", () => {
  it.each([
    [10, 0],
    [12, 1],
    [14, 2],
    [14.99, 3],
    [15, 10],
    [18, 10],
    [20, 10],
    [60, 17],
    [100, 24],
  ])("average %f rests on frame %i", (average, frame) => {
    expect(avatarFrame(average)).toBe(frame);
  });

  it("never rests on the see-through morph frames", () => {
    for (let average = 10; average <= 100; average += 0.25) {
      const frame = avatarFrame(average);
      expect(frame >= 4 && frame <= 9).toBe(false);
    }
  });

  it("has a picture for every frame, and never shrinks as the score grows", () => {
    let last = avatarFrame(10);
    for (let average = 10; average <= 100; average += 0.25) {
      const frame = avatarFrame(average);
      expect(frame).toBeGreaterThanOrEqual(last);
      expect(frame).toBeLessThan(AVATAR_FRAMES);
      last = frame;
    }
  });
});

describe("averageScore", () => {
  it("averages the six muscles", () => {
    expect(averageScore(scores("chest", 80, 20))).toBe(30);
  });
});

describe("starting body", () => {
  it.each([
    [undefined, 20],
    ["lean", 20],
    ["heavy", 10],
    ["muscular", 60],
  ] as const)("%s starts at an average of %i", (startBody, average) => {
    expect(computeState([], 3, d(0), startBody).average).toBe(average);
  });

  it("a heavy body grows with a check-in", () => {
    expect(computeState(checkins(1, 1), 3, d(0), "heavy").muscles).toEqual(scores("chest", 16, 11));
  });

  it("a muscular body shrinks with skip days", () => {
    expect(computeState(checkins(1, 1), 3, d(5), "muscular").muscles).toEqual(scores("chest", 62, 57));
  });

  it("a heavy body never drops below the lowest score", () => {
    expect(computeState(checkins(1, 1), 3, d(60), "heavy").average).toBe(10);
  });

  it("each choice shows the picture its score rests on", () => {
    expect(startBodyFrame("heavy")).toBe(0);
    expect(startBodyFrame("lean")).toBe(10);
    expect(startBodyFrame("muscular")).toBe(17);
  });
});
