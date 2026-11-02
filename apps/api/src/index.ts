import express from "express";
import mongoose from "mongoose";
import { env, isProduction } from "./env.js";
import { errorHandler, HTTP_NOT_FOUND, HttpError } from "./http.js";
import { Checkin } from "./models/checkin.js";
import { User } from "./models/user.js";
import { authRouter } from "./routes/auth.js";
import { checkinsRouter } from "./routes/checkins.js";
import { devRouter } from "./routes/dev.js";
import { meRouter } from "./routes/me.js";
import { selfiesRouter } from "./routes/selfies.js";
import { stateRouter } from "./routes/state.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/checkins", checkinsRouter);
app.use("/api/selfies", selfiesRouter);
app.use("/api/state", stateRouter);
if (!isProduction) app.use("/api/dev", devRouter);
app.use("/api", () => {
  throw new HttpError(HTTP_NOT_FOUND, "Not found.");
});
app.use(errorHandler);

await mongoose.connect(env.MONGO_URL);
// Waits for the unique indexes, so two requests can't both claim an email or a day's check-in.
await Promise.all([User.init(), Checkin.init()]);

app.listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`API listening on http://localhost:${env.PORT}`);
});
