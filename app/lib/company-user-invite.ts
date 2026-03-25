import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { buildUrlForAudience } from "@/app/lib/audience-routing";

const INVITE_TTL_HOURS = 72;
const INVITE_TTL_MS = INVITE_TTL_HOURS * 60 * 60 * 1000;

export type CompanyUserInvitePayload = {
  companyId: string;
  contactType: "email" | "phone";
  contact: string;
  role: "master";
  exp: number;
};

function getSecret() {
  return process.env.COMPANY_INVITE_SECRET || "local-company-invite-secret";
}

function signPayload(payloadBase64: string) {
  return createHmac("sha256", getSecret())
    .update(payloadBase64)
    .digest("base64url");
}

function isValidSignature(payloadBase64: string, signature: string) {
  const expected = signPayload(payloadBase64);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function createCompanyUserInviteToken(
  companyId: string,
  contactType: "email" | "phone",
  contact: string,
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const payload: CompanyUserInvitePayload = {
    companyId,
    contactType,
    contact,
    role: "master",
    exp: Math.floor(expiresAt.getTime() / 1000),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = signPayload(payloadBase64);
  return { token: `${payloadBase64}.${signature}`, expiresAt };
}

export function verifyCompanyUserInviteToken(
  token: string,
): CompanyUserInvitePayload | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  if (!isValidSignature(payloadBase64, signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8"),
    ) as CompanyUserInvitePayload;
    if (!payload.companyId || !payload.contact || !payload.contactType)
      return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildCompanyUserInviteUrl(request: NextRequest, token: string) {
  return buildUrlForAudience("company", "/company/auth/signup", request, {
    invite: token,
  });
}

export function getCompanyUserInviteTtlHours() {
  return INVITE_TTL_HOURS;
}
