import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { AgentSessionPayload } from "@/types/agent/session";

export const AGENT_SESSION_COOKIE = "agent_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function getSecret() {
  return process.env.AGENT_AUTH_SECRET || "local-agent-auth-secret";
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

export function createAgentSessionToken(userId: bigint | string) {
  const payload: AgentSessionPayload = {
    userId: userId.toString(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyAgentSessionToken(
  token?: string | null,
): AgentSessionPayload | null {
  if (!token) return null;
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  if (!isValidSignature(payloadBase64, signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8"),
    ) as AgentSessionPayload;
    if (!payload.userId || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAgentUserIdFromRequest(request: NextRequest): bigint | null {
  const token = request.cookies.get(AGENT_SESSION_COOKIE)?.value;
  const payload = verifyAgentSessionToken(token);
  if (!payload) return null;

  try {
    return BigInt(payload.userId);
  } catch {
    return null;
  }
}

export function attachAgentSession(
  response: NextResponse,
  userId: bigint | string,
) {
  response.cookies.set({
    name: AGENT_SESSION_COOKIE,
    value: createAgentSessionToken(userId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAgentSession(response: NextResponse) {
  response.cookies.set({
    name: AGENT_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
