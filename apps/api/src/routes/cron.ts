import { Router } from "express";
import { deleteExpiredDemoUsers } from "../demo.js";
import { env } from "../env.js";
import { HTTP_UNAUTHORIZED, HttpError } from "../http.js";

export const cronRouter = Router();

// Vercel Cron sends CRON_SECRET as a bearer token. Without the secret set, nobody gets in.
cronRouter.use((req, _res, next) => {
  if (!env.CRON_SECRET || req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) {
    throw new HttpError(HTTP_UNAUTHORIZED, "Not allowed.");
  }
  next();
});

cronRouter.get("/sweep-demos", async (_req, res) => {
  res.json({ deleted: await deleteExpiredDemoUsers() });
});
