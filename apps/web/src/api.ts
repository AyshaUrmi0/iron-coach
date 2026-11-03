import type { Language, StartBody } from "@iron-coach/core";

export const OFFLINE_MESSAGE = "Can't reach Iron Coach. Check your connection and try again.";

const HTTP_UNAUTHORIZED = 401;
const HTTP_CONFLICT = 409;

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly bodyType: "male" | "female";
  readonly startBody: StartBody;
  readonly weeklyGoal: number;
  readonly language: Language;
  readonly timezone: string;
  readonly isDemo: boolean;
}

export type FieldErrors = Readonly<Record<string, readonly string[] | undefined>>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: FieldErrors = {},
  ) {
    super(message);
  }
}

interface ErrorBody {
  readonly error?: string;
  readonly fields?: FieldErrors;
}

export function isLoggedOutError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_UNAUTHORIZED;
}

export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_CONFLICT;
}

/** Non-JSON replies happen when a proxy answers because the API itself is down. */
function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  const body = parseBody(await response.text());
  if (!response.ok) {
    const { error, fields } = (body ?? {}) as ErrorBody;
    throw new ApiError(response.status, error ?? "Something went wrong. Try again.", fields);
  }
  return body as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function patch<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function postForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: form });
}

export function post<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
}
