import { createHmac } from "crypto";

export class MessageSendValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageSendValidationError";
  }
}

export function getRequiredString(value: unknown, fieldLabel: string): string {
  if (typeof value !== "string") {
    throw new MessageSendValidationError(`${fieldLabel}을(를) 입력해주세요.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new MessageSendValidationError(`${fieldLabel}을(를) 입력해주세요.`);
  }

  return trimmed;
}

export function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizePhoneNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isValidKoreanMobilePhone(phone: string) {
  return /^01[016789]\d{7,8}$/.test(normalizePhoneNumber(phone));
}

export function createNcloudSignature({
  method,
  requestPath,
  timestamp,
  accessKey,
  secretKey,
}: {
  method: string;
  requestPath: string;
  timestamp: string;
  accessKey: string;
  secretKey: string;
}) {
  const message = `${method} ${requestPath}\n${timestamp}\n${accessKey}`;
  return createHmac("sha256", secretKey).update(message).digest("base64");
}
