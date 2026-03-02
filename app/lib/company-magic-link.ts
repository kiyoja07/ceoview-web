import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import {
  createDefaultNameFromEmail,
  getAppBaseUrl,
  isValidEmail,
} from "@/app/lib/agent-magic-link";

const COMPANY_MAGIC_LINK_TTL_MINUTES = 15;
const COMPANY_MAGIC_LINK_TTL_MS = COMPANY_MAGIC_LINK_TTL_MINUTES * 60 * 1000;

export { isValidEmail };
export { createDefaultNameFromEmail };

export function createCompanyMagicLinkToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashCompanyMagicLinkToken(token);
  const expiresAt = new Date(Date.now() + COMPANY_MAGIC_LINK_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashCompanyMagicLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getCompanyMagicLinkTtlMinutes() {
  return COMPANY_MAGIC_LINK_TTL_MINUTES;
}

export function buildCompanyMagicLinkUrl(request: NextRequest, token: string) {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/api/company/auth/magic-link?token=${encodeURIComponent(token)}`;
}
