import type { Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { env, isProduction } from "./env.js";
import { HTTP_UNAUTHORIZED, HttpError } from "./http.js";
import { User, type UserDoc } from "./models/user.js";

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
const MS_PER_SECOND = 1000;
export const SESSION_MS = 604_800_000; // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
} as const;

export function setAuthCookie(res: Response, userId: string): void {
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    algorithm: JWT_ALGORITHM,
    expiresIn: SESSION_MS / MS_PER_SECOND,
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

function userIdFromCookie(req: Request): string | undefined {
  const token = req.headers.cookie
    ?.split("; ")
    .find((cookie) => cookie.startsWith(COOKIE_PREFIX))
    ?.slice(COOKIE_PREFIX.length);
  return token ? userIdFromToken(token) : undefined;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const userId = userIdFromCookie(req);
  if (!userId) throw new HttpError(HTTP_UNAUTHORIZED, "Log in first.");

  // eslint-disable-next-line ts-patterns/no-param-reassign -- Express middleware passes data on the request
  req.userId = userId;
  next();
};

/** The logged-in user. A valid token can outlive its account, so a missing user is logged out. */
export async function currentUser(req: Request): Promise<UserDoc> {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(HTTP_UNAUTHORIZED, "Log in first.");
  return user;
}

/** The demo account this request belongs to, if any. Routes open to everyone can call it. */
export async function currentDemoUser(req: Request): Promise<UserDoc | undefined> {
  const userId = userIdFromCookie(req);
  const user = userId ? await User.findById(userId) : null;
  return user?.isDemo ? user : undefined;
}
