import { NextRequest, NextResponse } from "next/server";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import {
  confirmPhoneVerificationCode,
  PhoneVerificationError,
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
    const result = await confirmPhoneVerificationCode(
      { kind: "company", userId },
      verificationId,
      code,
    );

    return NextResponse.json({
      success: true,
      verified: result.verified,
      phone: result.phone,
    });
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Phone verify confirm error:", error);
    return NextResponse.json(
      { error: "인증 확인에 실패했습니다." },
      { status: 500 },
    );
  }
}
