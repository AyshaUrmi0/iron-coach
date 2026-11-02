import express from "express";
import mongoose from "mongoose";
import { env } from "./env.js";
import { errorHandler, HTTP_NOT_FOUND, HttpError } from "./http.js";
import { User } from "./models/user.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api", () => {
  throw new HttpError(HTTP_NOT_FOUND, "Not found.");
});
app.use(errorHandler);

await mongoose.connect(env.MONGO_URL);
// Waits for the unique email index, so two sign-ups can't both claim an address.
await User.init();

app.listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`API listening on http://localhost:${env.PORT}`);
});
