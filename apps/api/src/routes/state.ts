import { computeState, dateInTimezone, weakestMuscle } from "@iron-coach/core";
import { Router, type Request } from "express";
import { z } from "zod";
import { writeRoast, type RoastRequest } from "../ai/roastWriter.js";
import { currentUser, requireAuth } from "../auth.js";
import { isProduction } from "../env.js";
import { Checkin } from "../models/checkin.js";
import { Roast } from "../models/roast.js";
import type { UserDoc } from "../models/user.js";

const fakeTodaySchema = z.object({ today: z.iso.date().optional() });

/** DEV ONLY: ?today=YYYY-MM-DD fakes the date. Production ignores it. */
function fakeToday(req: Request): string | undefined {
  return isProduction ? undefined : fakeTodaySchema.parse(req.query).today;
}

/** Reuses today's roast while the level stays the same, so AI calls stay at a few a day. */
async function todaysRoast(user: UserDoc, today: string, request: RoastRequest): Promise<string> {
  const { level } = request;
  const cached = await Roast.findOne({ userId: user._id, date: today, level }).lean();
  if (cached) return cached.text;

  const { text, source } = await writeRoast(request);
  // Two requests at once can race on the unique index. The roast is still good, so only log it.
  await Roast.updateOne(
    { userId: user._id },
    { date: today, level, text, source },
    { upsert: true },
  ).catch((err: unknown) => console.warn("[roast] couldn't cache the roast", err));
  return text;
}

export const stateRouter = Router();

stateRouter.get("/", requireAuth, async (req, res) => {
  const user = await currentUser(req);
  const today = fakeToday(req) ?? dateInTimezone(new Date(), user.timezone);
  const checkins = await Checkin.find({ userId: user._id }).select("date muscles").lean();

  const state = computeState(checkins, user.weeklyGoal, today, user.startBody);
  const trainedToday = checkins.find((checkin) => checkin.date === today)?.muscles ?? [];
  const muscle = trainedToday.length ? trainedToday.join(" & ") : weakestMuscle(state.muscles);
  const roast = await todaysRoast(user, today, {
    name: user.name,
    level: state.roastLevel,
    skipDays: state.skipDays,
    weakestMuscle: muscle.toUpperCase(),
    streak: state.streak,
    language: user.language,
  });
  res.json({ state, roast });
});
