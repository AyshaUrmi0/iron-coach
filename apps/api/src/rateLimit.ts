import type { RequestHandler } from "express";
import { isProduction } from "./env.js";
import { HTTP_TOO_MANY_REQUESTS, HttpError, isDuplicateKeyError } from "./http.js";
import { RateLimit } from "./models/rateLimit.js";

interface RateLimitOptions {
  readonly name: string;
  readonly limit: number;
  readonly windowMs: number;
}

/**
 * Limits requests per IP address. Counts are kept in the database because
 * serverless instances don't share memory. Off in development and curl checks.
 */
export function rateLimit({ name, limit, windowMs }: RateLimitOptions): RequestHandler {
  return async (req, _res, next) => {
    if (!isProduction) {
      next();
      return;
    }
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const key = `${name}:${req.ip}:${windowStart}`;
    try {
      const counter = await RateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
        { upsert: true, returnDocument: "after" },
      );
      if (counter.count > limit) {
        throw new HttpError(HTTP_TOO_MANY_REQUESTS, "Too many attempts. Try again in a few minutes.");
      }
    } catch (err) {
      // Two first requests racing to create the counter: let this one through.
      if (!isDuplicateKeyError(err)) throw err;
    }
    next();
  };
}
