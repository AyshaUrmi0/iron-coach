import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { HTTP_UNAUTHORIZED, HttpError } from "../http.js";
import {
  BODY_TYPES,
  LANGUAGES,
  MAX_WEEKLY_GOAL,
  MIN_WEEKLY_GOAL,
  nameSchema,
  toPublicUser,
  User,
} from "../models/user.js";

// Strict, so asking to change email, passwordHash or timezone is an error, not silently ignored.
const updateSchema = z.strictObject({
  name: nameSchema.optional(),
  bodyType: z.enum(BODY_TYPES).optional(),
  weeklyGoal: z.number().int().min(MIN_WEEKLY_GOAL).max(MAX_WEEKLY_GOAL).optional(),
  language: z.enum(LANGUAGES).optional(),
});

// A valid token can outlive its account, so a missing user counts as logged out.
const ACCOUNT_GONE = "Log in first.";

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get("/", async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(HTTP_UNAUTHORIZED, ACCOUNT_GONE);
  res.json({ user: toPublicUser(user) });
});

meRouter.patch("/", async (req, res) => {
  const updates = updateSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(req.userId, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) throw new HttpError(HTTP_UNAUTHORIZED, ACCOUNT_GONE);
  res.json({ user: toPublicUser(user) });
});
