import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";

const MAGIC_LINK_TTL_MINUTES = 15;
const MAGIC_LINK_TTL_MS = MAGIC_LINK_TTL_MINUTES * 60 * 1000;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createMagicLinkToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashMagicLinkToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashMagicLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getMagicLinkTtlMinutes() {
  return MAGIC_LINK_TTL_MINUTES;
}

export function createDefaultNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "user";
  const sanitized = localPart.replace(/[^\w.-]/g, "");
  return (sanitized || "user").slice(0, 100);
}

function getOriginFromRequest(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) return null;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export function getAppBaseUrl(request: NextRequest) {
  const envBaseUrl =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || null;
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");
  return getOriginFromRequest(request) || "http://localhost:3000";
}

export function buildMagicLinkUrl(request: NextRequest, token: string) {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/api/agent/auth/magic-link?token=${encodeURIComponent(token)}`;
}
