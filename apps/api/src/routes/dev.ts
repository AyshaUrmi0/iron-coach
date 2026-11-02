import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import { currentUser, requireAuth } from "../auth.js";
import { HTTP_CONFLICT, HTTP_CREATED, HttpError, isDuplicateKeyError } from "../http.js";
import { Checkin, musclesSchema } from "../models/checkin.js";
import { writeSelfie } from "../selfies.js";

const SEED_SELFIE_NAME = "seed.png";
// A 1x1 PNG, so seeded days still have a selfie to fetch.
const SEED_SELFIE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

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
  const selfiePath = path.posix.join(user._id.toString(), SEED_SELFIE_NAME);
  await writeSelfie(selfiePath, SEED_SELFIE);

  // shortcut: reset leaves old selfie files on disk, fine for dev-only data.
  if (reset) await Checkin.deleteMany({ userId: user._id });
  await Checkin.insertMany(
    dates.map((date) => ({
      userId: user._id,
      date,
      takenAt: new Date(`${date}T12:00:00Z`),
      muscles,
      selfiePath,
    })),
  ).catch((err: unknown) => {
    if (isDuplicateKeyError(err)) throw new HttpError(HTTP_CONFLICT, "A date is already checked in.");
    throw err;
  });
  res.status(HTTP_CREATED).json({ created: dates.length });
});
