import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { currentUser, requireAuth } from "../auth.js";
import { HTTP_NOT_FOUND, HttpError } from "../http.js";
import { Checkin } from "../models/checkin.js";
import { UPLOADS_DIR } from "../selfies.js";

export const selfiesRouter = Router();

selfiesRouter.use(requireAuth);

selfiesRouter.get("/:checkinId", async (req, res) => {
  const { checkinId } = req.params;
  const user = await currentUser(req);
  // Someone else's selfie gets the same 404 as a missing one, so its existence isn't revealed.
  const checkin = isValidObjectId(checkinId)
    ? await Checkin.findOne({ _id: checkinId, userId: user._id })
    : null;
  if (!checkin) throw new HttpError(HTTP_NOT_FOUND, "Selfie not found.");

  res.sendFile(checkin.selfiePath, {
    root: UPLOADS_DIR,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
});
