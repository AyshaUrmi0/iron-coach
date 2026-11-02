import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { clearAuthCookie, setAuthCookie } from "../auth.js";
import {
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_NO_CONTENT,
  HTTP_UNAUTHORIZED,
  HttpError,
  isDuplicateKeyError,
} from "../http.js";
import { nameSchema, toPublicUser, User, type UserDoc } from "../models/user.js";

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

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

async function createUser(name: string, email: string, password: string): Promise<UserDoc> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    return await User.create({ name, email, passwordHash });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new HttpError(HTTP_CONFLICT, "That email is already registered.");
    }
    throw err;
  }
}

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const user = await createUser(name, email, password);
  setAuthCookie(res, user._id.toString());
  res.status(HTTP_CREATED).json({ user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(HTTP_UNAUTHORIZED, "Wrong email or password.");
  }
  setAuthCookie(res, user._id.toString());
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(HTTP_NO_CONTENT).end();
});
