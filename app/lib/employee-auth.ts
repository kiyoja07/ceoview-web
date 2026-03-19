import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const EMPLOYEE_SESSION_COOKIE = "employee_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type EmployeeSessionPayload = {
  userId: string;
  exp: number;
};

function getSecret() {
  return process.env.EMPLOYEE_AUTH_SECRET || "local-employee-auth-secret";
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

export function createEmployeeSessionToken(userId: bigint | string) {
  const payload: EmployeeSessionPayload = {
    userId: userId.toString(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyEmployeeSessionToken(
  token?: string | null,
): EmployeeSessionPayload | null {
  if (!token) return null;
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;
  if (!isValidSignature(payloadBase64, signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8"),
    ) as EmployeeSessionPayload;
    if (!payload.userId || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getEmployeeUserIdFromRequest(request: NextRequest): bigint | null {
  const token = request.cookies.get(EMPLOYEE_SESSION_COOKIE)?.value;
  const payload = verifyEmployeeSessionToken(token);
  if (!payload) return null;

  try {
    return BigInt(payload.userId);
  } catch {
    return null;
  }
}

export function attachEmployeeSession(
  response: NextResponse,
  userId: bigint | string,
) {
  response.cookies.set({
    name: EMPLOYEE_SESSION_COOKIE,
    value: createEmployeeSessionToken(userId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearEmployeeSession(response: NextResponse) {
  response.cookies.set({
    name: EMPLOYEE_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
