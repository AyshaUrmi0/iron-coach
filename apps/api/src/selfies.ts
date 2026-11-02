import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOADS_DIR = path.resolve(import.meta.dirname, "../uploads");

const PLACEHOLDER_NAME = "placeholder.png";
// A 1x1 PNG, for check-ins that have no real photo: demo accounts and dev seed data.
const PLACEHOLDER_SELFIE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

const JPEG_SIGNATURE = Buffer.from("ffd8ff", "hex");
const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const RIFF_SIGNATURE = Buffer.from("RIFF");
const WEBP_SIGNATURE = Buffer.from("WEBP");
const WEBP_SIGNATURE_OFFSET = 8;

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
  const fullPath = path.join(UPLOADS_DIR, selfiePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

/** Makes sure the user has the placeholder image and returns its selfiePath. */
export async function writePlaceholderSelfie(userId: string): Promise<string> {
  const selfiePath = path.posix.join(userId, PLACEHOLDER_NAME);
  await writeSelfie(selfiePath, PLACEHOLDER_SELFIE);
  return selfiePath;
}

export async function deleteUserSelfies(userId: string): Promise<void> {
  await rm(path.join(UPLOADS_DIR, userId), { recursive: true, force: true });
}
