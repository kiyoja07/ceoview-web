import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  buildAgentInviteUrl,
  createAgentInviteToken,
  getAgentInviteTtlHours,
  hashAgentInviteToken,
  isValidEmail,
} from "@/app/lib/agent-invite";
import { sendNcloudMail } from "@/app/lib/ncloud-mailer";
import type { SendAgentInviteBody } from "@/types/agent/invite";

function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  if (!localPart || !domain) return "";

  if (localPart.length <= 2) {
    return `${localPart.slice(0, 1)}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
}

async function requireAgentMember(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      agentOrganizationId: true,
      agentOrganization: {
        select: {
          organizationName: true,
          organizationNumber: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId || !user.agentOrganization) {
    return { error: "소속 에이전트 조직이 없습니다.", status: 403 } as const;
  }

  return { user } as const;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "초대 토큰이 필요합니다." },
        { status: 400 },
      );
    }

    const invite = await prisma.agentUserInviteToken.findUnique({
      where: { tokenHash: hashAgentInviteToken(token) },
      select: {
        invitedEmail: true,
        expiresAt: true,
        usedAt: true,
        agentOrganization: {
          select: {
            organizationName: true,
            organizationNumber: true,
          },
        },
        inviterUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const now = new Date();
    if (!invite || invite.usedAt || invite.expiresAt <= now) {
      return NextResponse.json(
        { error: "초대 링크가 만료되었거나 이미 사용되었습니다." },
        { status: 410 },
      );
    }

    return NextResponse.json({
      organization: {
        name: invite.agentOrganization.organizationName,
        number: invite.agentOrganization.organizationNumber,
      },
      inviter: {
        name: invite.inviterUser.name,
        email: invite.inviterUser.email,
      },
      invitedEmailMasked: maskEmail(invite.invitedEmail),
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Agent invite preview error:", error);
    return NextResponse.json(
      { error: "초대 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as SendAgentInviteBody;
    const invitedEmail = body.email?.trim().toLowerCase();

    if (!invitedEmail) {
      return NextResponse.json(
        { error: "초대할 이메일을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!isValidEmail(invitedEmail)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (invitedEmail === auth.user.email) {
      return NextResponse.json(
        { error: "본인 이메일은 초대할 수 없습니다." },
        { status: 400 },
      );
    }

    const organizationId = auth.user.agentOrganizationId;
    const organization = auth.user.agentOrganization;

    if (!organizationId || !organization) {
      return NextResponse.json(
        { error: "소속 에이전트 조직이 없습니다." },
        { status: 403 },
      );
    }

    const existingUser = await prisma.agentUser.findUnique({
      where: { email: invitedEmail },
      select: {
        id: true,
        isActive: true,
        agentOrganizationId: true,
      },
    });

    if (existingUser?.agentOrganizationId) {
      if (existingUser.agentOrganizationId === organizationId) {
        return NextResponse.json(
          { error: "이미 같은 Agent에 소속된 사용자입니다." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "이미 다른 Agent에 소속된 사용자입니다." },
        { status: 409 },
      );
    }

    if (existingUser && !existingUser.isActive) {
      return NextResponse.json(
        { error: "비활성화된 계정에는 초대를 보낼 수 없습니다." },
        { status: 400 },
      );
    }

    const { token, tokenHash, expiresAt } = createAgentInviteToken();
    const inviteUrl = buildAgentInviteUrl(request, token);

    await prisma.$transaction(async (tx) => {
      await tx.agentUserInviteToken.deleteMany({
        where: {
          agentOrganizationId: organizationId,
          invitedEmail,
          usedAt: null,
        },
      });

      await tx.agentUserInviteToken.create({
        data: {
          agentOrganizationId: organizationId,
          inviterUserId: auth.user.id,
          invitedEmail,
          tokenHash,
          expiresAt,
        },
      });
    });

    const ttlHours = getAgentInviteTtlHours();
    const organizationLabel =
      organization.organizationName || organization.organizationNumber;
    const title = "[관리자 시스템] Agent 소속 초대 안내";

    const bodyHtml = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#2563eb;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">관리자 시스템</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">안녕하세요.</p>
              <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
                <strong>${auth.user.name}</strong> 님이 <strong>${organizationLabel}</strong> Agent 소속 가입을 초대했습니다.
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:13px;line-height:1.6;">
                아래 버튼을 클릭한 뒤, 초대받은 이메일 주소를 입력하고 가입 정보를 작성해주세요.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <a href="${inviteUrl}" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      초대 수락하고 가입하기
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">버튼이 작동하지 않으면 아래 링크를 직접 열어주세요.</p>
              <p style="margin:0 0 18px;word-break:break-all;"><a href="${inviteUrl}" target="_blank" style="color:#2563eb;font-size:12px;text-decoration:underline;">${inviteUrl}</a></p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                이 링크는 <strong>${ttlHours}시간</strong> 동안 유효하며 1회만 사용할 수 있습니다.<br />
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:18px 32px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#d1d5db;font-size:11px;">© ${new Date().getFullYear()} 관리자 시스템</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    await sendNcloudMail({
      to: invitedEmail,
      title,
      body: bodyHtml,
    });

    return NextResponse.json({
      message: `${invitedEmail} 주소로 초대 메일을 발송했습니다.`,
    });
  } catch (error) {
    console.error("Agent invite send error:", error);
    return NextResponse.json(
      { error: "초대 메일 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
