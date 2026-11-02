import type { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { HTTP_UNAUTHORIZED, HttpError } from "./http.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const COOKIE_NAME = "token";
const COOKIE_PREFIX = `${COOKIE_NAME}=`;
const JWT_ALGORITHM = "HS256";
const SESSION_SECONDS = 604_800; // 7 days
const SESSION_MS = 604_800_000; // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
} as const;

export function setAuthCookie(res: Response, userId: string): void {
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    algorithm: JWT_ALGORITHM,
    expiresIn: SESSION_SECONDS,
  });
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: SESSION_MS });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
}

function userIdFromToken(token: string): string | undefined {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] }).sub?.toString();
  } catch {
    return undefined;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.headers.cookie
    ?.split("; ")
    .find((cookie) => cookie.startsWith(COOKIE_PREFIX))
    ?.slice(COOKIE_PREFIX.length);
  const userId = token && userIdFromToken(token);
  if (!userId) throw new HttpError(HTTP_UNAUTHORIZED, "Log in first.");

  // eslint-disable-next-line ts-patterns/no-param-reassign -- Express middleware passes data on the request
  req.userId = userId;
  next();
};
