import { MIN_PASSWORD_LENGTH } from "@iron-coach/core";
import bcrypt from "bcrypt";
import { Router, type Response } from "express";
import { z } from "zod";
import { clearAuthCookie, currentDemoUser, setAuthCookie } from "../auth.js";
import { createDemoUser, upgradeDemoUser, type NewAccount } from "../demo.js";
import {
  conflictOnDuplicate,
  HTTP_CREATED,
  HTTP_NO_CONTENT,
  HTTP_UNAUTHORIZED,
  HttpError,
} from "../http.js";
import { nameSchema, toPublicUser, User, type UserDoc } from "../models/user.js";
import { rateLimit } from "../rateLimit.js";

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;
const ONE_HOUR_MS = 3_600_000;
const FIFTEEN_MINUTES_MS = 900_000;
const MAX_LOGINS = 20;
const MAX_SIGNUPS = 10;
const MAX_DEMOS = 10;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH)
    // bcrypt silently ignores everything past 72 bytes.
    .refine((password) => Buffer.byteLength(password) <= MAX_PASSWORD_BYTES, {
      error: `Must be at most ${MAX_PASSWORD_BYTES} bytes.`,
    }),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

async function createAccount(demoUser: UserDoc | undefined, account: NewAccount): Promise<UserDoc> {
  const saving: Promise<UserDoc> = demoUser ? upgradeDemoUser(demoUser, account) : User.create(account);
  return saving.catch(conflictOnDuplicate("That email is already registered."));
}

function startSession(res: Response, user: UserDoc): void {
  setAuthCookie(res, user._id.toString());
  res.json({ user: toPublicUser(user) });
}

export const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit({ name: "register", limit: MAX_SIGNUPS, windowMs: ONE_HOUR_MS }),
  async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    // Signing up from a demo keeps what the visitor did there.
    const user = await createAccount(await currentDemoUser(req), { name, email, passwordHash });
    startSession(res.status(HTTP_CREATED), user);
  },
);

authRouter.post(
  "/demo",
  rateLimit({ name: "demo", limit: MAX_DEMOS, windowMs: ONE_HOUR_MS }),
  async (_req, res) => {
    startSession(res.status(HTTP_CREATED), await createDemoUser());
  },
);

authRouter.post(
  "/login",
  rateLimit({ name: "login", limit: MAX_LOGINS, windowMs: FIFTEEN_MINUTES_MS }),
  async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(HTTP_UNAUTHORIZED, "Wrong email or password.");
    }
    startSession(res, user);
  },
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(HTTP_NO_CONTENT).end();
});
