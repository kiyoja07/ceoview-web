import { NextRequest, NextResponse } from "next/server";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import {
  PhoneVerificationError,
  sendPhoneVerificationCode,
} from "@/app/lib/phone-verification";

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
    const result = await sendPhoneVerificationCode(
      { kind: "company", userId },
      body.phone?.trim() ?? "",
    );

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Phone verify send error:", error);
    return NextResponse.json(
      { error: "인증번호 발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
