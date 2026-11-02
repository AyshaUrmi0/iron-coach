import type { ErrorRequestHandler } from "express";
import { mongo } from "mongoose";
import multer from "multer";
import { z } from "zod";

export const HTTP_CREATED = 201;
export const HTTP_NO_CONTENT = 204;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
const HTTP_SERVER_ERROR = 500;
const MONGO_DUPLICATE_KEY = 11_000;

export function isDuplicateKeyError(err: unknown): boolean {
  return err instanceof mongo.MongoServerError && err.code === MONGO_DUPLICATE_KEY;
}

/** An error whose message is safe to show the client. */
export class HttpError extends Error {
  readonly expose = true;

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// express.json() throws errors of this same shape for bad or oversized bodies.
function isClientError(err: unknown): err is Error & { status: number } {
  return (
    err instanceof Error &&
    "expose" in err &&
    err.expose === true &&
    "status" in err &&
    typeof err.status === "number"
  );
}

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    const { formErrors, fieldErrors } = z.flattenError(err);
    res
      .status(HTTP_BAD_REQUEST)
      .json({ error: formErrors[0] ?? "Invalid input.", fields: fieldErrors });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(HTTP_BAD_REQUEST).json({ error: err.message });
    return;
  }
  if (isClientError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(HTTP_SERVER_ERROR).json({ error: "Something went wrong." });
};
