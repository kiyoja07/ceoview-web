import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";

/** 최대 인증 시도 횟수 */
const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      verificationId?: string;
      code?: string;
    };

    const verificationId = body.verificationId?.trim();
    const code = body.code?.trim();

    if (!verificationId || !code) {
      return NextResponse.json(
        { error: "인증번호를 입력해주세요." },
        { status: 400 },
      );
    }

    let verificationIdBigInt: bigint;
    try {
      verificationIdBigInt = BigInt(verificationId);
    } catch {
      return NextResponse.json(
        { error: "잘못된 인증 요청입니다." },
        { status: 400 },
      );
    }

    const record = await prisma.phoneVerificationCode.findUnique({
      where: { id: verificationIdBigInt },
    });

    if (!record || record.companyUserId !== userId) {
      return NextResponse.json(
        { error: "잘못된 인증 요청입니다." },
        { status: 400 },
      );
    }

    if (record.verifiedAt) {
      return NextResponse.json({
        success: true,
        verified: true,
        phone: record.phone,
      });
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "인증번호가 만료되었습니다. 다시 요청해주세요." },
        { status: 400 },
      );
    }

    // 시도 횟수 체크: 같은 verificationId에 대한 confirm 요청 수
    const attemptCount = await prisma.phoneVerificationCode.count({
      where: {
        companyUserId: userId,
        phone: record.phone,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (attemptCount > MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    if (record.code !== code) {
      return NextResponse.json(
        { error: "인증번호가 일치하지 않습니다." },
        { status: 400 },
      );
    }

    // 인증 성공 → verifiedAt 업데이트
    await prisma.phoneVerificationCode.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      phone: record.phone,
    });
  } catch (error) {
    console.error("Phone verify confirm error:", error);
    return NextResponse.json(
      { error: "인증 확인에 실패했습니다." },
      { status: 500 },
    );
  }
}
