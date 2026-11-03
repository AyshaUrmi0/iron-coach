import { MUSCLE_GROUPS, type MuscleGroup } from "@iron-coach/core";
import { model, Schema, type HydratedDocument, type Types } from "mongoose";
import { z } from "zod";
import { PLACEHOLDER_SELFIE_PATH } from "../selfies.js";

export const musclesSchema = z
  .array(z.enum(MUSCLE_GROUPS))
  .min(1)
  .transform((muscles) => [...new Set(muscles)]);

export interface CheckinFields {
  userId: Types.ObjectId;
  date: string;
  takenAt: Date;
  muscles: MuscleGroup[];
  selfiePath: string;
  isSample?: boolean;
}

const checkinSchema = new Schema<CheckinFields>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  takenAt: { type: Date, required: true },
  muscles: { type: [{ type: String, enum: MUSCLE_GROUPS }], required: true },
  selfiePath: { type: String, required: true },
  // Made-up history a demo account starts with. Removed if the visitor signs up.
  isSample: { type: Boolean, default: false },
});

checkinSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Checkin = model<CheckinFields>("Checkin", checkinSchema);

export interface PublicCheckin {
  readonly id: string;
  readonly date: string;
  readonly takenAt: Date;
  readonly muscles: readonly MuscleGroup[];
  readonly hasPhoto: boolean;
}

/** The only check-in fields that may leave the API. Never includes selfiePath. */
export function toPublicCheckin(checkin: HydratedDocument<CheckinFields>): PublicCheckin {
  return {
    id: checkin._id.toString(),
    date: checkin.date,
    takenAt: checkin.takenAt,
    muscles: checkin.muscles,
    hasPhoto: checkin.selfiePath !== PLACEHOLDER_SELFIE_PATH,
  };
}
