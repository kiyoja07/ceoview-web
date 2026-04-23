import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import {
  buildUrlForAudience,
  getBaseUrlForAudience,
} from "@/app/lib/audience-routing";

const MAGIC_LINK_TTL_MINUTES = process.env.MAGIC_LINK_TTL_MINUTES!;
const MAGIC_LINK_TTL_MS = parseInt(MAGIC_LINK_TTL_MINUTES) * 60 * 1000;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createMagicLinkToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashMagicLinkToken(token);
  console.log("Generated magic link token:", {
    MAGIC_LINK_TTL_MS,
  });
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  console.log("Generated magic link token:", { token, tokenHash, expiresAt });
  return { token, tokenHash, expiresAt };
}

export function hashMagicLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createDefaultNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "user";
  const sanitized = localPart.replace(/[^\w.-]/g, "");
  return (sanitized || "user").slice(0, 100);
}

export function getAppBaseUrl(request: NextRequest) {
  return getBaseUrlForAudience("public", request);
}

export function buildMagicLinkUrl(request: NextRequest, token: string) {
  return buildUrlForAudience("public", "/api/agent/auth/magic-link", request, {
    token,
  });
}
