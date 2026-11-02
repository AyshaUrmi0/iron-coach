import { randomUUID } from "node:crypto";
import { addDays, dateInTimezone, type MuscleGroup } from "@iron-coach/core";
import { Checkin } from "./models/checkin.js";
import { User, type UserDoc } from "./models/user.js";
import { deleteUserSelfies, writePlaceholderSelfie } from "./selfies.js";

const DEMO_NAME = "Rookie";
const DEMO_LIFETIME_MS = 604_800_000; // 7 days, the same as a login session
const SWEEP_EVERY_MS = 3_600_000; // 1 hour
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

/** Each visitor gets their own account, so nobody sees anyone else's demo data. */
export async function createDemoUser(): Promise<UserDoc> {
  const user = await User.create({
    name: DEMO_NAME,
    email: `${randomUUID()}@demo.invalid`,
    passwordHash: NO_PASSWORD,
    isDemo: true,
    demoExpiresAt: new Date(Date.now() + DEMO_LIFETIME_MS),
  });
  const selfiePath = await writePlaceholderSelfie(user._id.toString());
  const today = dateInTimezone(new Date(), user.timezone);
  await Checkin.insertMany(
    SAMPLE_CHECKINS.map(({ daysAgo, muscles }) => {
      const date = addDays(today, -daysAgo);
      return {
        userId: user._id,
        date,
        takenAt: new Date(`${date}T12:00:00Z`),
        muscles,
        selfiePath,
        isSample: true,
      };
    }),
  );
  return user;
}

/** Turns a demo account into a real one. The visitor's own check-ins stay, the samples go. */
export async function upgradeDemoUser(
  user: UserDoc,
  account: { readonly name: string; readonly email: string; readonly passwordHash: string },
): Promise<UserDoc> {
  user.set({ ...account, isDemo: false, demoExpiresAt: undefined });
  await user.save();
  await Checkin.deleteMany({ userId: user._id, isSample: true });
  return user;
}

export async function deleteExpiredDemoUsers(): Promise<number> {
  const expired = await User.find({ isDemo: true, demoExpiresAt: { $lt: new Date() } }).select("_id");
  await Promise.all(
    expired.map(async ({ _id }) => {
      await Checkin.deleteMany({ userId: _id });
      await deleteUserSelfies(_id.toString());
      await User.deleteOne({ _id, isDemo: true });
    }),
  );
  return expired.length;
}

export function startDemoSweep(): void {
  const sweep = async (): Promise<void> => {
    try {
      await deleteExpiredDemoUsers();
    } catch (err) {
      console.error("Demo cleanup failed, will try again next hour.", err);
    }
  };
  void sweep();
  setInterval(() => void sweep(), SWEEP_EVERY_MS).unref();
}
