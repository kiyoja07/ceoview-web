import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { getAppBaseUrl, isValidEmail } from "@/app/lib/agent-magic-link";

const EMPLOYEE_MAGIC_LINK_TTL_MINUTES = 15;
const EMPLOYEE_MAGIC_LINK_TTL_MS = EMPLOYEE_MAGIC_LINK_TTL_MINUTES * 60 * 1000;

export { isValidEmail };

export function createEmployeeMagicLinkToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashEmployeeMagicLinkToken(token);
  const expiresAt = new Date(Date.now() + EMPLOYEE_MAGIC_LINK_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashEmployeeMagicLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getEmployeeMagicLinkTtlMinutes() {
  return EMPLOYEE_MAGIC_LINK_TTL_MINUTES;
}

export function buildEmployeeMagicLinkUrl(request: NextRequest, token: string) {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/api/employee/auth/magic-link?token=${encodeURIComponent(token)}`;
}
