import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import { isValidEmail } from "@/app/lib/company-magic-link";
import {
  buildCompanyUserInviteUrl,
  createCompanyUserInviteToken,
  getCompanyUserInviteTtlHours,
} from "@/app/lib/company-user-invite";
import { sendNcloudMail } from "@/app/lib/ncloud-mailer";
import type { SendCompanyUserInviteBody } from "@/types/company/users";

function isValidPhone(phone: string) {
  return /^01[016789]\d{7,8}$/.test(phone.replace(/\D/g, ""));
}

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

async function requireCompanyMaster(request: NextRequest) {
  const userId = getCompanyUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.companyUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      isMaster: true,
      companyId: true,
      company: {
        select: {
          businessNumber: true,
          businessName: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.isMaster) {
    return {
      error: "사용자 초대는 마스터 사용자만 가능합니다.",
      status: 403,
    } as const;
  }

  if (!user.company) {
    return {
      error: "회사 정보를 찾을 수 없습니다.",
      status: 404,
    } as const;
  }

  return { user } as const;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyMaster(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as SendCompanyUserInviteBody;
    const contactType = body.contactType;
    const rawContact = body.contact?.trim();

    if (!contactType || !["email", "phone"].includes(contactType)) {
      return NextResponse.json(
        { error: "초대 방식을 선택해주세요. (email 또는 phone)" },
        { status: 400 },
      );
    }

    if (!rawContact) {
      return NextResponse.json(
        {
          error:
            contactType === "email"
              ? "이메일을 입력해주세요."
              : "전화번호를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const contact =
      contactType === "email"
        ? rawContact.toLowerCase()
        : rawContact.replace(/\D/g, "");

    if (contactType === "email" && !isValidEmail(contact)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (contactType === "phone" && !isValidPhone(contact)) {
      return NextResponse.json(
        { error: "올바른 전화번호 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (contactType === "email") {
      if (contact === auth.user.email) {
        return NextResponse.json(
          { error: "본인 이메일은 초대할 수 없습니다." },
          { status: 400 },
        );
      }

      const existingUser = await prisma.companyUser.findFirst({
        where: {
          companyId: auth.user.companyId,
          email: contact,
        },
        select: { id: true, isActive: true },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error: existingUser.isActive
              ? "이미 소속된 사용자입니다."
              : "비활성화된 사용자입니다. 관리자에게 문의해주세요.",
          },
          { status: 409 },
        );
      }
    }

    if (contactType === "phone") {
      const existingUser = await prisma.companyUser.findFirst({
        where: {
          companyId: auth.user.companyId,
          phone: contact,
        },
        select: { id: true, isActive: true },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error: existingUser.isActive
              ? "이미 소속된 전화번호입니다."
              : "비활성화된 사용자입니다. 관리자에게 문의해주세요.",
          },
          { status: 409 },
        );
      }
    }

    const { token } = createCompanyUserInviteToken(
      auth.user.companyId.toString(),
      contactType,
      contact,
    );
    const inviteUrl = buildCompanyUserInviteUrl(request, token);
    const ttlHours = getCompanyUserInviteTtlHours();

    if (contactType === "email") {
      const companyLabel =
        auth.user.company.businessName ||
        formatBusinessNumber(auth.user.company.businessNumber);
      const title = `[관리자 시스템] ${companyLabel} 소속 사용자 초대 안내`;

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
            <td style="background-color:#059669;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">관리자 시스템</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">안녕하세요.</p>
              <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
                <strong>${auth.user.name}</strong> 님이 <strong>${companyLabel}</strong> 소속 사용자로 초대했습니다.
              </p>
              <p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.6;">
                <strong>사업자번호:</strong> ${formatBusinessNumber(auth.user.company.businessNumber)}
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:13px;line-height:1.6;">
                아래 버튼을 클릭하여 가입을 진행해주세요.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <a href="${inviteUrl}" target="_blank" style="display:inline-block;background-color:#059669;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      초대 수락하고 가입하기
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">버튼이 작동하지 않으면 아래 링크를 직접 열어주세요.</p>
              <p style="margin:0 0 18px;word-break:break-all;"><a href="${inviteUrl}" target="_blank" style="color:#059669;font-size:12px;text-decoration:underline;">${inviteUrl}</a></p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                이 링크는 <strong>${ttlHours}시간</strong> 동안 유효합니다.<br />
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
        to: contact,
        title,
        body: bodyHtml,
      });

      return NextResponse.json({
        message: `${contact} 주소로 초대 메일을 발송했습니다.`,
      });
    }

    return NextResponse.json({
      message: `초대 링크가 생성되었습니다. ${ttlHours}시간 내에 전달해주세요.`,
      inviteUrl,
    });
  } catch (error) {
    console.error("Company user invite error:", error);
    return NextResponse.json(
      { error: "초대 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
