import { Router } from "express";
import { z } from "zod";
import { currentUser, requireAuth } from "../auth.js";
import { deleteExpiredDemoUsers, placeholderCheckin } from "../demo.js";
import { conflictOnDuplicate, HTTP_CREATED } from "../http.js";
import { Checkin, musclesSchema } from "../models/checkin.js";

const seedSchema = z.strictObject({
  dates: z.array(z.iso.date()).min(1),
  muscles: musclesSchema,
  reset: z.boolean().default(false),
});

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

devRouter.post("/sweep-demos", async (_req, res) => {
  res.json({ deleted: await deleteExpiredDemoUsers() });
});
