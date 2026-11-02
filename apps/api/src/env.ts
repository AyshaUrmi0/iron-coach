import { z } from "zod";

const DEFAULT_PORT = 4000;
const MIN_SECRET_LENGTH = 32;

const envSchema = z.object({
  MONGO_URL: z.string().min(1),
  JWT_SECRET: z.string().min(MIN_SECRET_LENGTH),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  NODE_ENV: z.string().optional(),
});

export const env = envSchema.parse(process.env);
