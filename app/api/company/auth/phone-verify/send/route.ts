import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import { sendNcloudSms } from "@/app/lib/ncloud-sms";

/** 인증번호 유효 시간(분) */
const CODE_TTL_MINUTES = 3;
/** 같은 번호에 대한 재발송 쿨다운(초) */
const RESEND_COOLDOWN_SECONDS = 60;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidPhone(phone: string): boolean {
  return /^01[016789]\d{7,8}$/.test(phone.replace(/\D/g, ""));
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { phone?: string };
    const phoneRaw = body.phone?.trim() ?? "";
    const phoneDigits = phoneRaw.replace(/\D/g, "");

    if (!phoneDigits || !isValidPhone(phoneDigits)) {
      return NextResponse.json(
        { error: "올바른 휴대폰 번호를 입력해주세요." },
        { status: 400 },
      );
    }

    // 쿨다운 체크: 같은 사용자 + 같은 번호로 최근 발송 이력
    const cooldownCutoff = new Date(
      Date.now() - RESEND_COOLDOWN_SECONDS * 1000,
    );
    const recent = await prisma.phoneVerificationCode.findFirst({
      where: {
        companyUserId: userId,
        phone: phoneDigits,
        createdAt: { gte: cooldownCutoff },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    // DB에 인증 코드 저장
    const record = await prisma.phoneVerificationCode.create({
      data: {
        companyUserId: userId,
        phone: phoneDigits,
        code,
        expiresAt,
      },
    });

    // SMS 발송
    await sendNcloudSms({
      to: phoneDigits,
      content: `[인증번호] ${code}\n본인 확인 인증번호입니다. ${CODE_TTL_MINUTES}분 이내에 입력해주세요.`,
    });

    return NextResponse.json({
      success: true,
      verificationId: record.id.toString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Phone verify send error:", error);
    return NextResponse.json(
      { error: "인증번호 발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
