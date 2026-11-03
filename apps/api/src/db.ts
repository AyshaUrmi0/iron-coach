import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { env } from "./env.js";
import { Checkin } from "./models/checkin.js";
import { RateLimit } from "./models/rateLimit.js";
import { User } from "./models/user.js";

// Serverless instances each hold their own connections, and free database tiers cap the total.
const MAX_POOL_SIZE = 5;
const CONNECT_TIMEOUT_MS = 8000;

let connection: Promise<void> | undefined;

async function connect(): Promise<void> {
  await mongoose.connect(env.MONGO_URL, {
    maxPoolSize: MAX_POOL_SIZE,
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
  });
  // Waits for the unique indexes, so two requests can't both claim an email or a day's check-in.
  await Promise.all([User.init(), Checkin.init(), RateLimit.init()]);
}

/** Connects once per server instance, on the first request that needs the database. */
export const connectToDatabase: RequestHandler = async (_req, _res, next) => {
  connection ??= connect();
  try {
    await connection;
    next();
  } catch (err) {
    // Forgets the failure, so the next request tries again.
    connection = undefined;
    next(err);
  }
};
