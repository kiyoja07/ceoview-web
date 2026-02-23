import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/password";
import { attachAgentSession } from "@/app/lib/agent-auth";
import type { SignupBody } from "@/types/agent/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 이름은 필수입니다." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.agentUser.create({
      data: {
        email,
        passwordHash,
        loginProvider: "LOCAL",
        name,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        agentOrganizationId: true,
      },
    });

    const response = NextResponse.json(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        hasOrganization: Boolean(user.agentOrganizationId),
        redirectTo: user.agentOrganizationId ? "/agent/company" : "/agent/auth/organization",
      },
      { status: 201 },
    );

    attachAgentSession(response, user.id);
    return response;
  } catch (error: unknown) {
    console.error("Agent signup error:", error);

    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
