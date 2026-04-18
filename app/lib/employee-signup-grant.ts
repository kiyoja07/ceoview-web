import { createHmac, timingSafeEqual } from "crypto";
import type { PayslipChannel } from "@/generated/prisma/enums";

const EMPLOYEE_SIGNUP_GRANT_TTL_SECONDS = 60 * 30;

export type EmployeeSignupGrantPayload = {
  employeeId: string;
  companyId: string;
  recipient: string;
  channel: PayslipChannel;
  exp: number;
};

function getSecret() {
  return (
    process.env.EMPLOYEE_SIGNUP_GRANT_SECRET ||
    process.env.EMPLOYEE_AUTH_SECRET ||
    "local-employee-signup-grant-secret"
  );
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

export function createEmployeeSignupGrant(input: {
  employeeId: bigint | string;
  companyId: bigint | string;
  recipient: string;
  channel: PayslipChannel;
}) {
  const payload: EmployeeSignupGrantPayload = {
    employeeId: input.employeeId.toString(),
    companyId: input.companyId.toString(),
    recipient: input.recipient,
    channel: input.channel,
    exp: Math.floor(Date.now() / 1000) + EMPLOYEE_SIGNUP_GRANT_TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyEmployeeSignupGrant(
  grant?: string | null,
): EmployeeSignupGrantPayload | null {
  if (!grant) return null;
  const [payloadBase64, signature] = grant.split(".");
  if (!payloadBase64 || !signature) return null;
  if (!isValidSignature(payloadBase64, signature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8"),
    ) as EmployeeSignupGrantPayload;
    if (
      !payload.employeeId ||
      !payload.companyId ||
      !payload.recipient ||
      !payload.channel ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
