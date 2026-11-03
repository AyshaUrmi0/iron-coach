import { LANGUAGES, MAX_NAME_LENGTH, START_BODIES } from "@iron-coach/core";
import { model, Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import { z } from "zod";

export const nameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);
export const BODY_TYPES = ["male", "female"] as const;
export const MIN_WEEKLY_GOAL = 2;
export const MAX_WEEKLY_GOAL = 7;

const DEFAULT_WEEKLY_GOAL = 3;

// Register only asks for name, email and password. Onboarding sets the rest.
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    bodyType: { type: String, enum: BODY_TYPES, required: true, default: "male" },
    startBody: { type: String, enum: START_BODIES, required: true, default: "lean" },
    weeklyGoal: {
      type: Number,
      required: true,
      min: MIN_WEEKLY_GOAL,
      max: MAX_WEEKLY_GOAL,
      default: DEFAULT_WEEKLY_GOAL,
    },
    language: { type: String, enum: LANGUAGES, required: true, default: "en" },
    timezone: { type: String, required: true, default: "Asia/Dhaka" },
    isDemo: { type: Boolean, required: true, default: false },
    demoExpiresAt: { type: Date },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export interface PublicUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly bodyType: UserDoc["bodyType"];
  readonly startBody: UserDoc["startBody"];
  readonly weeklyGoal: number;
  readonly language: UserDoc["language"];
  readonly timezone: string;
  readonly isDemo: boolean;
}

/** The only user fields that may leave the API. Never includes passwordHash. */
export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    bodyType: user.bodyType,
    startBody: user.startBody,
    weeklyGoal: user.weeklyGoal,
    language: user.language,
    timezone: user.timezone,
    isDemo: user.isDemo,
  };
}
