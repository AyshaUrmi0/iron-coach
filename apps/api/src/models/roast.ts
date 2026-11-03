import { ROAST_LEVELS } from "@iron-coach/core";
import { model, Schema } from "mongoose";

const ROAST_SOURCES = ["groq", "openrouter", "bank"] as const;

// One per user, overwritten when the level or the day changes, so this collection never grows.
const roastSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  date: { type: String, required: true },
  level: { type: String, enum: ROAST_LEVELS, required: true },
  text: { type: String, required: true },
  source: { type: String, enum: ROAST_SOURCES, required: true },
});

export const Roast = model("Roast", roastSchema);
