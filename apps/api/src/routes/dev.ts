import { LANGUAGES, ROAST_LEVELS, type RoastLevel } from "@iron-coach/core";
import { Router } from "express";
import { z } from "zod";
import { writeRoast } from "../ai/roastWriter.js";
import { currentUser, requireAuth } from "../auth.js";
import { deleteExpiredDemoUsers, placeholderCheckin } from "../demo.js";
import { conflictOnDuplicate, HTTP_CREATED } from "../http.js";
import { Checkin, musclesSchema } from "../models/checkin.js";

const seedSchema = z.strictObject({
  dates: z.array(z.iso.date()).min(1),
  muscles: musclesSchema,
  reset: z.boolean().default(false),
});

const roastSchema = z.object({
  level: z.enum(ROAST_LEVELS),
  language: z.enum(LANGUAGES).optional(),
});

// Skip days that fit each level, since this endpoint doesn't look at real check-ins.
/* eslint-disable ts-patterns/no-magic-numbers -- this table is where the sample values are named */
const SAMPLE_SKIP_DAYS: Readonly<Record<RoastLevel, number>> = {
  hype: 0,
  rest: 0,
  annoyed: 1,
  angry: 2,
  savage: 4,
  nuclear: 6,
  comeback: 0,
};
/* eslint-enable ts-patterns/no-magic-numbers */
const SAMPLE_MUSCLE = "CHEST";
const SAMPLE_STREAK = 3;

export const devRouter = Router();

devRouter.use(requireAuth);

devRouter.post("/seed", async (req, res) => {
  const { dates, muscles, reset } = seedSchema.parse(req.body);
  const user = await currentUser(req);

  // shortcut: reset leaves old selfie files on disk, fine for dev-only data.
  if (reset) await Checkin.deleteMany({ userId: user._id });
  await Checkin.insertMany(dates.map((date) => placeholderCheckin(user._id, date, muscles))).catch(
    conflictOnDuplicate("A date is already checked in."),
  );
  res.status(HTTP_CREATED).json({ created: dates.length });
});

devRouter.get("/roast", async (req, res) => {
  const { level, language } = roastSchema.parse(req.query);
  const user = await currentUser(req);
  res.json(
    await writeRoast({
      name: user.name,
      level,
      skipDays: SAMPLE_SKIP_DAYS[level],
      weakestMuscle: SAMPLE_MUSCLE,
      streak: SAMPLE_STREAK,
      language: language ?? user.language,
    }),
  );
});

devRouter.post("/sweep-demos", async (_req, res) => {
  res.json({ deleted: await deleteExpiredDemoUsers() });
});
