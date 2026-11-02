import { model, Schema } from "mongoose";

const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes each counter by itself once its time window has passed.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = model("RateLimit", rateLimitSchema);
