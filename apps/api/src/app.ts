import express from "express";
import { connectToDatabase } from "./db.js";
import { isProduction } from "./env.js";
import { errorHandler, HTTP_NOT_FOUND, HttpError } from "./http.js";
import { authRouter } from "./routes/auth.js";
import { checkinsRouter } from "./routes/checkins.js";
import { cronRouter } from "./routes/cron.js";
import { devRouter } from "./routes/dev.js";
import { machinesRouter } from "./routes/machines.js";
import { mealsRouter } from "./routes/meals.js";
import { meRouter } from "./routes/me.js";
import { selfiesRouter } from "./routes/selfies.js";
import { stateRouter } from "./routes/state.js";

export const app = express();

// Vercel sets the visitor's IP itself and overwrites anything the visitor sends, so it's safe to
// trust in production. Rate limiting counts by this IP.
if (isProduction) app.set("trust proxy", true);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api", connectToDatabase);
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/checkins", checkinsRouter);
app.use("/api/meals", mealsRouter);
app.use("/api/machines", machinesRouter);
app.use("/api/selfies", selfiesRouter);
app.use("/api/state", stateRouter);
app.use("/api/cron", cronRouter);
if (!isProduction) app.use("/api/dev", devRouter);
app.use("/api", () => {
  throw new HttpError(HTTP_NOT_FOUND, "Not found.");
});
app.use(errorHandler);

// Vercel loads this file and runs its default export. Local development starts from local.ts.
export default app;
