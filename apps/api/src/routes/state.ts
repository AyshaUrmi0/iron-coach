import { computeState, dateInTimezone, pickRoast } from "@iron-coach/core";
import { Router, type Request } from "express";
import { z } from "zod";
import { currentUser, requireAuth } from "../auth.js";
import { isProduction } from "../env.js";
import { Checkin } from "../models/checkin.js";

const fakeTodaySchema = z.object({ today: z.iso.date().optional() });

/** DEV ONLY: ?today=YYYY-MM-DD fakes the date. Production ignores it. */
function fakeToday(req: Request): string | undefined {
  return isProduction ? undefined : fakeTodaySchema.parse(req.query).today;
}

export const stateRouter = Router();

stateRouter.get("/", requireAuth, async (req, res) => {
  const user = await currentUser(req);
  const today = fakeToday(req) ?? dateInTimezone(new Date(), user.timezone);
  const checkins = await Checkin.find({ userId: user._id }).select("date muscles").lean();

  const state = computeState(checkins, user.weeklyGoal, today);
  const trainedToday = checkins.find((checkin) => checkin.date === today)?.muscles ?? [];
  const roast = pickRoast(state.roastLevel, user.language, {
    name: user.name,
    days: state.skipDays,
    muscle: trainedToday.join(" & ").toUpperCase(),
  });
  res.json({ state, roast });
});
