import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { getAppBaseUrl, isValidEmail } from "@/app/lib/agent-magic-link";

const AGENT_INVITE_TTL_HOURS = 72;
const AGENT_INVITE_TTL_MS = AGENT_INVITE_TTL_HOURS * 60 * 60 * 1000;

export { isValidEmail };

export function createAgentInviteToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashAgentInviteToken(token);
  const expiresAt = new Date(Date.now() + AGENT_INVITE_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashAgentInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAgentInviteTtlHours() {
  return AGENT_INVITE_TTL_HOURS;
}

export function buildAgentInviteUrl(request: NextRequest, token: string) {
  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/agent/auth/invite?token=${encodeURIComponent(token)}`;
}
