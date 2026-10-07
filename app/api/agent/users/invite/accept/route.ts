import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { attachAgentSession } from "@/app/lib/agent-auth";
import { hashAgentInviteToken, isValidEmail } from "@/app/lib/agent-invite";
import type {
  AcceptAgentInviteBody,
  AcceptAgentInviteResponse,
} from "@/types/agent/invite";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AcceptAgentInviteBody;

    const token = body.token?.trim();
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;
    const agreedToJoin = body.agreedToJoin;

    if (!token || !email || !name) {
      return NextResponse.json(
        { error: "토큰, 이메일, 이름은 필수입니다." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (!agreedToJoin) {
      return NextResponse.json(
        { error: "Agent 소속 가입 동의가 필요합니다." },
        { status: 400 },
      );
    }

    const now = new Date();
    const tokenHash = hashAgentInviteToken(token);

    const invite = await prisma.agentUserInviteToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        invitedEmail: true,
        usedAt: true,
        expiresAt: true,
        agentOrganizationId: true,
      },
    });

    if (!invite || invite.usedAt || invite.expiresAt <= now) {
      return NextResponse.json(
        { error: "초대 링크가 만료되었거나 이미 사용되었습니다." },
        { status: 410 },
      );
    }

    if (invite.invitedEmail !== email) {
      return NextResponse.json(
        { error: "초대 메일을 받은 이메일 주소를 정확히 입력해주세요." },
        { status: 400 },
      );
    }

    const joinedUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.agentUser.findUnique({
        where: { email },
        select: {
          id: true,
          isActive: true,
          agentOrganizationId: true,
        },
      });

      if (existing) {
        if (!existing.isActive) {
          throw new Error("INACTIVE_USER");
        }

        if (existing.agentOrganizationId) {
          if (existing.agentOrganizationId === invite.agentOrganizationId) {
            throw new Error("ALREADY_MEMBER");
          }

          throw new Error("ALREADY_IN_OTHER_ORG");
        }
      }

      const consume = await tx.agentUserInviteToken.updateMany({
        where: {
          id: invite.id,
          expiresAt: { gt: now },
          OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
        },
        data: {
          usedAt: now,
        },
      });

      if (consume.count !== 1) {
        throw new Error("INVITE_EXPIRED");
      }

      const user = existing
        ? await tx.agentUser.update({
            where: { id: existing.id },
            data: {
              name,
              phone,
              agentOrganizationId: invite.agentOrganizationId,
            },
            select: {
              id: true,
              email: true,
              name: true,
              agentOrganizationId: true,
            },
          })
        : await tx.agentUser.create({
            data: {
              email,
              name,
              phone,
              loginProvider: "LOCAL",
              // (loginProvider, providerUserId) 고유 제약 때문에 비워 두면 두 번째 사용자부터 충돌한다.
              providerUserId: email,
              agentOrganizationId: invite.agentOrganizationId,
            },
            select: {
              id: true,
              email: true,
              name: true,
              agentOrganizationId: true,
            },
          });

      await tx.agentUserInviteToken.update({
        where: { id: invite.id },
        data: {
          acceptedAgentUserId: user.id,
        },
      });

      return user;
    });

    const responseBody: AcceptAgentInviteResponse = {
      redirectTo: joinedUser.agentOrganizationId ? "/agent/company" : "/agent/auth/organization",
      message: "Agent 소속 가입이 완료되었습니다.",
    };

    const response = NextResponse.json(responseBody);
    attachAgentSession(response, joinedUser.id);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INACTIVE_USER") {
        return NextResponse.json(
          { error: "비활성화된 계정은 초대 수락이 불가능합니다." },
          { status: 400 },
        );
      }

      if (error.message === "ALREADY_MEMBER") {
        return NextResponse.json(
          { error: "이미 해당 Agent 소속 사용자입니다." },
          { status: 409 },
        );
      }

      if (error.message === "ALREADY_IN_OTHER_ORG") {
        return NextResponse.json(
          { error: "이미 다른 Agent 소속 사용자입니다." },
          { status: 409 },
        );
      }

      if (error.message === "INVITE_EXPIRED") {
        return NextResponse.json(
          { error: "초대 링크가 만료되었거나 이미 사용되었습니다." },
          { status: 410 },
        );
      }
    }

    console.error("Agent invite accept error:", error);
    return NextResponse.json(
      { error: "초대 수락 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
