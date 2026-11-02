import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { env } from "./env.js";

const JPEG_SIGNATURE = Buffer.from("ffd8ff", "hex");
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const RIFF_SIGNATURE = Buffer.from("RIFF");
const WEBP_SIGNATURE = Buffer.from("WEBP");
const WEBP_SIGNATURE_OFFSET = 8;
const BLOB_FOUND = 200;

/** Check-ins with no real photo (demo accounts, dev seed data) all point at this built-in image. */
export const PLACEHOLDER_SELFIE_PATH = "placeholder.png";
const PLACEHOLDER_SELFIE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

// Selfies live in private Vercel Blob storage when deployed, and on local disk in development.
const useBlobStorage = Boolean(env.BLOB_READ_WRITE_TOKEN);

function diskPath(selfiePath: string): string {
  return path.resolve(import.meta.dirname, "../uploads", selfiePath);
}

/**
 * Works out the image type from the file's first bytes, because the type and
 * filename in an upload are whatever the client chose to send.
 */
export function sniffImageExtension(bytes: Buffer): "jpg" | "png" | "webp" | undefined {
  const startsWith = (signature: Buffer, offset = 0): boolean =>
    bytes.subarray(offset, offset + signature.length).equals(signature);

  if (startsWith(JPEG_SIGNATURE)) return "jpg";
  if (startsWith(PNG_SIGNATURE)) return "png";
  if (startsWith(RIFF_SIGNATURE) && startsWith(WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET)) return "webp";
  return undefined;
}

export function newSelfiePath(userId: string, extension: string): string {
  return path.posix.join(userId, `${randomUUID()}.${extension}`);
}

export async function writeSelfie(selfiePath: string, bytes: Buffer): Promise<void> {
  if (useBlobStorage) {
    await put(selfiePath, bytes, { access: "private", addRandomSuffix: false });
    return;
  }
  const fullPath = diskPath(selfiePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

/** The selfie's bytes, or undefined when the file is missing. Callers must check ownership first. */
export async function readSelfie(selfiePath: string): Promise<Buffer | undefined> {
  if (selfiePath === PLACEHOLDER_SELFIE_PATH) return PLACEHOLDER_SELFIE;
  if (useBlobStorage) {
    const result = await get(selfiePath, { access: "private" });
    return result?.statusCode === BLOB_FOUND
      ? Buffer.from(await new Response(result.stream).arrayBuffer())
      : undefined;
  }
  try {
    return await readFile(diskPath(selfiePath));
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return undefined;
    throw err;
  }
}
