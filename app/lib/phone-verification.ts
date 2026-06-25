import prisma from "@/app/lib/prisma";
import { sendSms } from "@/app/lib/messages/sms";

export const PHONE_VERIFICATION_CODE_TTL_MINUTES = 3;
export const PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;
export const PHONE_VERIFICATION_MAX_ATTEMPTS = 5;

type PhoneVerificationOwner =
  | {
      kind: "company";
      userId: string;
    }
  | {
      kind: "agent";
      userId: string;
    };

type PhoneVerificationRecord = {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
  companyUserId?: string;
  agentUserId?: string;
};

export class PhoneVerificationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PhoneVerificationError";
    this.status = status;
  }
}

export function normalizePhoneVerificationPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isValidVerificationPhone(phone: string) {
  return /^01[016789]\d{7,8}$/.test(normalizePhoneVerificationPhone(phone));
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOwnerWhere(owner: PhoneVerificationOwner) {
  return owner.kind === "company"
    ? { companyUserId: owner.userId }
    : { agentUserId: owner.userId };
}

async function findVerificationRecord(
  owner: PhoneVerificationOwner,
  verificationId: string,
): Promise<PhoneVerificationRecord | null> {
  if (owner.kind === "company") {
    return prisma.phoneVerificationCode.findUnique({
      where: { id: verificationId },
    });
  }

  return prisma.agentPhoneVerificationCode.findUnique({
    where: { id: verificationId },
  });
}

function hasOwnerAccess(
  owner: PhoneVerificationOwner,
  record: PhoneVerificationRecord,
) {
  return owner.kind === "company"
    ? record.companyUserId === owner.userId
    : record.agentUserId === owner.userId;
}

function parseVerificationId(verificationId: string) {
  try {
    return verificationId;
  } catch {
    throw new PhoneVerificationError("잘못된 인증 정보입니다.", 400);
  }
}

export async function sendPhoneVerificationCode(
  owner: PhoneVerificationOwner,
  phone: string,
) {
  const phoneDigits = normalizePhoneVerificationPhone(phone);

  if (!phoneDigits || !isValidVerificationPhone(phoneDigits)) {
    throw new PhoneVerificationError(
      "올바른 휴대폰 번호를 입력해주세요.",
      400,
    );
  }

  const cooldownCutoff = new Date(
    Date.now() - PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000,
  );

  const recent =
    owner.kind === "company"
      ? await prisma.phoneVerificationCode.findFirst({
          where: {
            ...getOwnerWhere(owner),
            phone: phoneDigits,
            createdAt: { gte: cooldownCutoff },
          },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.agentPhoneVerificationCode.findFirst({
          where: {
            ...getOwnerWhere(owner),
            phone: phoneDigits,
            createdAt: { gte: cooldownCutoff },
          },
          orderBy: { createdAt: "desc" },
        });

  if (recent) {
    throw new PhoneVerificationError("잠시 후 다시 시도해주세요.", 429);
  }

  const code = generateCode();
  const expiresAt = new Date(
    Date.now() + PHONE_VERIFICATION_CODE_TTL_MINUTES * 60 * 1000,
  );

  const record =
    owner.kind === "company"
      ? await prisma.phoneVerificationCode.create({
          data: {
            companyUserId: owner.userId,
            phone: phoneDigits,
            code,
            expiresAt,
          },
        })
      : await prisma.agentPhoneVerificationCode.create({
          data: {
            agentUserId: owner.userId,
            phone: phoneDigits,
            code,
            expiresAt,
          },
        });

  await sendSms({
    to: phoneDigits,
    content: `[인증번호] ${code}\n본인 확인 인증번호입니다. ${PHONE_VERIFICATION_CODE_TTL_MINUTES}분 이내에 입력해주세요.`,
  });

  return {
    verificationId: record.id.toString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function confirmPhoneVerificationCode(
  owner: PhoneVerificationOwner,
  verificationIdRaw: string,
  code: string,
) {
  const verificationId = parseVerificationId(verificationIdRaw);
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    throw new PhoneVerificationError("인증번호를 입력해주세요.", 400);
  }

  const record = await findVerificationRecord(owner, verificationId);

  if (!record || !hasOwnerAccess(owner, record)) {
    throw new PhoneVerificationError("잘못된 인증 요청입니다.", 400);
  }

  if (record.verifiedAt) {
    return {
      verified: true,
      phone: record.phone,
    };
  }

  if (record.expiresAt < new Date()) {
    throw new PhoneVerificationError(
      "인증번호가 만료되었습니다. 다시 요청해주세요.",
      400,
    );
  }

  const attemptWindow = new Date(Date.now() - 10 * 60 * 1000);
  const attemptCount =
    owner.kind === "company"
      ? await prisma.phoneVerificationCode.count({
          where: {
            ...getOwnerWhere(owner),
            phone: record.phone,
            createdAt: { gte: attemptWindow },
          },
        })
      : await prisma.agentPhoneVerificationCode.count({
          where: {
            ...getOwnerWhere(owner),
            phone: record.phone,
            createdAt: { gte: attemptWindow },
          },
        });

  if (attemptCount > PHONE_VERIFICATION_MAX_ATTEMPTS) {
    throw new PhoneVerificationError(
      "인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.",
      429,
    );
  }

  if (record.code !== trimmedCode) {
    throw new PhoneVerificationError("인증번호가 일치하지 않습니다.", 400);
  }

  if (owner.kind === "company") {
    await prisma.phoneVerificationCode.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });
  } else {
    await prisma.agentPhoneVerificationCode.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });
  }

  return {
    verified: true,
    phone: record.phone,
  };
}

export async function assertVerifiedPhoneChange(
  owner: PhoneVerificationOwner,
  phone: string,
  verificationId?: string | null,
) {
  const normalizedPhone = normalizePhoneVerificationPhone(phone);
  if (!normalizedPhone) {
    return;
  }

  if (!verificationId) {
    throw new PhoneVerificationError("휴대폰 인증이 필요합니다.", 400);
  }

  const record = await findVerificationRecord(owner, parseVerificationId(verificationId));

  if (
    !record ||
    !hasOwnerAccess(owner, record) ||
    record.phone !== normalizedPhone ||
    !record.verifiedAt
  ) {
    throw new PhoneVerificationError("휴대폰 인증을 완료해주세요.", 400);
  }
}
