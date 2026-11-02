import { LANGUAGES } from "@iron-coach/core";
import { model, Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import { z } from "zod";

const MAX_NAME_LENGTH = 50;

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
    weeklyGoal: {
      type: Number,
      required: true,
      min: MIN_WEEKLY_GOAL,
      max: MAX_WEEKLY_GOAL,
      default: DEFAULT_WEEKLY_GOAL,
    },
    language: { type: String, enum: LANGUAGES, required: true, default: "en" },
    timezone: { type: String, required: true, default: "Asia/Dhaka" },
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
  readonly weeklyGoal: number;
  readonly language: UserDoc["language"];
  readonly timezone: string;
}

/** The only user fields that may leave the API. Never includes passwordHash. */
export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    bodyType: user.bodyType,
    weeklyGoal: user.weeklyGoal,
    language: user.language,
    timezone: user.timezone,
  };
}
