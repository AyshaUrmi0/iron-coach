import { z } from "zod";

const DEFAULT_PORT = 4000;
const MIN_SECRET_LENGTH = 32;

const envSchema = z.object({
  MONGO_URL: z.string().min(1),
  JWT_SECRET: z.string().min(MIN_SECRET_LENGTH),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  NODE_ENV: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  AI_ROASTS_ENABLED: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
