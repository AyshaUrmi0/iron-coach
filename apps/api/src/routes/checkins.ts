import { dateInTimezone } from "@iron-coach/core";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { currentUser, requireAuth } from "../auth.js";
import { conflictOnDuplicate, HTTP_BAD_REQUEST, HTTP_CREATED, HttpError } from "../http.js";
import { Checkin, musclesSchema, toPublicCheckin } from "../models/checkin.js";
import {
  newSelfiePath,
  PLACEHOLDER_SELFIE_PATH,
  sniffImageExtension,
  writeSelfie,
} from "../selfies.js";

const MAX_SELFIE_BYTES = 4_194_304; // 4 MB: Vercel refuses request bodies over 4.5 MB

// Kept in memory so nothing reaches the disk until the upload has passed every check.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SELFIE_BYTES, files: 1 },
});

const createSchema = z.object({
  // A multipart field sent once arrives as a plain string, not an array.
  muscles: z.preprocess((value) => (typeof value === "string" ? [value] : value), musclesSchema),
});

const listSchema = z.object({
  month: z.string().refine((month) => z.iso.date().safeParse(`${month}-01`).success, {
    error: "Must be a month like 2026-03.",
  }),
});

export const checkinsRouter = Router();

checkinsRouter.use(requireAuth);

checkinsRouter.post("/", upload.single("selfie"), async (req, res) => {
  if (!req.file) throw new HttpError(HTTP_BAD_REQUEST, "A selfie is required.");
  const extension = sniffImageExtension(req.file.buffer);
  if (!extension) throw new HttpError(HTTP_BAD_REQUEST, "Selfie must be a JPEG, PNG or WebP image.");
  const { muscles } = createSchema.parse(req.body);

  const user = await currentUser(req);
  const takenAt = new Date();
  const userId = user._id.toString();
  // Demo visitors are anonymous, so their photos are never kept.
  const selfiePath = user.isDemo ? PLACEHOLDER_SELFIE_PATH : newSelfiePath(userId, extension);

  // Saved before the file, so a second check-in today is refused without leaving a stray selfie.
  const checkin = await Checkin.create({
    userId: user._id,
    date: dateInTimezone(takenAt, user.timezone),
    takenAt,
    muscles,
    selfiePath,
  }).catch(conflictOnDuplicate("Already checked in today."));

  if (!user.isDemo) {
    try {
      await writeSelfie(selfiePath, req.file.buffer);
    } catch (err) {
      await checkin.deleteOne();
      throw err;
    }
  }
  res.status(HTTP_CREATED).json({ checkin: toPublicCheckin(checkin) });
});

checkinsRouter.get("/", async (req, res) => {
  const { month } = listSchema.parse(req.query);
  const user = await currentUser(req);
  const checkins = await Checkin.find({
    userId: user._id,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  }).sort({ date: 1 });
  res.json({ checkins: checkins.map(toPublicCheckin) });
});
