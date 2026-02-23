import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [algorithm, salt, storedHash] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHash) return false;

  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  const stored = Buffer.from(storedHash, "base64url");

  if (stored.length !== derived.length) return false;
  return timingSafeEqual(stored, derived);
}
