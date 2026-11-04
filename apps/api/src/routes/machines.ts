import { Router } from "express";
import { detectMachine } from "../ai/machineDetector.js";
import { currentUser, requireAuth } from "../auth.js";
import { HTTP_BAD_REQUEST, HttpError } from "../http.js";
import { rateLimit } from "../rateLimit.js";
import { sniffImageExtension } from "../selfies.js";
import { upload } from "./checkins.js";

const MAX_SCANS_PER_HOUR = 30; // keeps the free Gemini quota for real use
const ONE_HOUR_MS = 3_600_000;
const IMAGE_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export const machinesRouter = Router();

machinesRouter.use(requireAuth);

machinesRouter.post(
  "/detect",
  rateLimit({ name: "detect-machine", limit: MAX_SCANS_PER_HOUR, windowMs: ONE_HOUR_MS }),
  upload.single("photo"),
  async (req, res) => {
    const user = await currentUser(req);
    // Demo photos are never stored, and Google can keep what the free tier receives.
    if (user.isDemo) throw new HttpError(HTTP_BAD_REQUEST, "Demo accounts can't use this. Sign up first.");
    if (!req.file) throw new HttpError(HTTP_BAD_REQUEST, "A photo is required.");
    const extension = sniffImageExtension(req.file.buffer);
    if (!extension) throw new HttpError(HTTP_BAD_REQUEST, "Photo must be a JPEG, PNG or WebP image.");
    res.json(await detectMachine(req.file.buffer, IMAGE_TYPES[extension]));
  },
);
