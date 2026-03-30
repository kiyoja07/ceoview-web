import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  confirmPhoneVerificationCode,
  PhoneVerificationError,
} from "@/app/lib/phone-verification";

async function requireActiveAgentUserId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return null;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  if (!user?.isActive) {
    return null;
  }

  return user.id;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireActiveAgentUserId(request);
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
      { kind: "agent", userId },
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

    console.error("Agent phone verify confirm error:", error);
    return NextResponse.json(
      { error: "인증 확인에 실패했습니다." },
      { status: 500 },
    );
  }
}
