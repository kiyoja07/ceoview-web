import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/app/lib/agent-magic-link";

const PAYSLIP_ACCESS_TTL_HOURS = 72;
const PAYSLIP_ACCESS_TTL_MS = PAYSLIP_ACCESS_TTL_HOURS * 60 * 60 * 1000;

export function createPayslipAccessToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashPayslipAccessToken(token);
  const expiresAt = new Date(Date.now() + PAYSLIP_ACCESS_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashPayslipAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPayslipViewUrl(request: NextRequest, token: string) {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/payslip/view?token=${encodeURIComponent(token)}`;
}

export function getPayslipAccessTtlHours() {
  return PAYSLIP_ACCESS_TTL_HOURS;
}
