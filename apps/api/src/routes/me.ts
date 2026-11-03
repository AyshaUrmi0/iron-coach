import { LANGUAGES, START_BODIES } from "@iron-coach/core";
import { Router } from "express";
import { z } from "zod";
import { currentUser, requireAuth } from "../auth.js";
import { Roast } from "../models/roast.js";
import {
  BODY_TYPES,
  MAX_WEEKLY_GOAL,
  MIN_WEEKLY_GOAL,
  nameSchema,
  toPublicUser,
} from "../models/user.js";

// Strict, so asking to change email, passwordHash or timezone is an error, not silently ignored.
const updateSchema = z.strictObject({
  name: nameSchema.optional(),
  bodyType: z.enum(BODY_TYPES).optional(),
  startBody: z.enum(START_BODIES).optional(),
  weeklyGoal: z.number().int().min(MIN_WEEKLY_GOAL).max(MAX_WEEKLY_GOAL).optional(),
  language: z.enum(LANGUAGES).optional(),
});

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get("/", async (req, res) => {
  res.json({ user: toPublicUser(await currentUser(req)) });
});

meRouter.patch("/", async (req, res) => {
  const updates = updateSchema.parse(req.body);
  const user = await currentUser(req);
  user.set(updates);
  await user.save();
  // A saved roast could use the old name or language.
  await Roast.deleteOne({ userId: user._id });
  res.json({ user: toPublicUser(user) });
});
