import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  PhoneVerificationError,
  sendPhoneVerificationCode,
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

    const body = (await request.json()) as { phone?: string };
    const result = await sendPhoneVerificationCode(
      { kind: "agent", userId },
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

    console.error("Agent phone verify send error:", error);
    return NextResponse.json(
      { error: "인증번호 발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
