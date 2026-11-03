import { randomUUID } from "node:crypto";
import { addDays, dateInTimezone, type MuscleGroup } from "@iron-coach/core";
import type { Types } from "mongoose";
import { SESSION_MS } from "./auth.js";
import { Checkin, type CheckinFields } from "./models/checkin.js";
import { Meal } from "./models/meal.js";
import { Roast } from "./models/roast.js";
import { User, type UserDoc } from "./models/user.js";
import { PLACEHOLDER_SELFIE_PATH } from "./selfies.js";

const DEMO_NAME = "Badass Lazy Weak Lad";
// Not a bcrypt hash, so no password can ever match it and demo accounts can't be logged in to.
const NO_PASSWORD = "!demo-account-has-no-password";

/* eslint-disable ts-patterns/no-magic-numbers -- this table is where the sample history is defined */
// With the default goal of 3, the last check-in being 5 days ago means 2 skip days:
// a new visitor meets an angry coach and has a reason to check in.
const SAMPLE_CHECKINS: readonly { readonly daysAgo: number; readonly muscles: MuscleGroup[] }[] = [
  { daysAgo: 11, muscles: ["chest", "arms"] },
  { daysAgo: 9, muscles: ["legs", "core"] },
  { daysAgo: 7, muscles: ["back", "shoulders"] },
  { daysAgo: 5, muscles: ["chest", "arms"] },
];
/* eslint-enable ts-patterns/no-magic-numbers */

export interface NewAccount {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
}

/** A check-in with no real photo, for demo history and dev seed data. */
export function placeholderCheckin(
  userId: Types.ObjectId,
  date: string,
  muscles: MuscleGroup[],
): CheckinFields {
  return {
    userId,
    date,
    takenAt: new Date(`${date}T12:00:00Z`),
    muscles,
    selfiePath: PLACEHOLDER_SELFIE_PATH,
  };
}

/** Each visitor gets their own account, so nobody sees anyone else's demo data. */
export async function createDemoUser(): Promise<UserDoc> {
  const user = await User.create({
    name: DEMO_NAME,
    email: `${randomUUID()}@demo.invalid`,
    passwordHash: NO_PASSWORD,
    isDemo: true,
    // A demo lasts as long as its login session.
    demoExpiresAt: new Date(Date.now() + SESSION_MS),
  });
  const today = dateInTimezone(new Date(), user.timezone);
  await Checkin.insertMany(
    SAMPLE_CHECKINS.map(({ daysAgo, muscles }) => ({
      ...placeholderCheckin(user._id, addDays(today, -daysAgo), muscles),
      isSample: true,
    })),
  );
  return user;
}

/** Turns a demo account into a real one. The visitor's own check-ins stay, the samples go. */
export async function upgradeDemoUser(
  user: UserDoc,
  account: NewAccount,
): Promise<UserDoc> {
  user.set({ ...account, isDemo: false, demoExpiresAt: undefined });
  await user.save();
  await Checkin.deleteMany({ userId: user._id, isSample: true });
  await Roast.deleteOne({ userId: user._id });
  return user;
}

export async function deleteExpiredDemoUsers(): Promise<number> {
  const expired = await User.find({ isDemo: true, demoExpiresAt: { $lt: new Date() } }).select("_id");
  await Promise.all(
    expired.map(async ({ _id }) => {
      await Checkin.deleteMany({ userId: _id });
      await Meal.deleteMany({ userId: _id });
      await Roast.deleteOne({ userId: _id });
      await User.deleteOne({ _id, isDemo: true });
    }),
  );
  return expired.length;
}
