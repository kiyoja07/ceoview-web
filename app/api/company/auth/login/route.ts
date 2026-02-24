import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  buildCompanyMagicLinkUrl,
  createCompanyMagicLinkToken,
  getCompanyMagicLinkTtlMinutes,
  isValidEmail,
} from "@/app/lib/company-magic-link";
import { sendNcloudMail } from "@/app/lib/ncloud-mailer";
import type { CompanyLoginBody } from "@/types/company/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompanyLoginBody;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    const user = await prisma.companyUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({
        message: "입력한 이메일로 로그인 링크를 전송했습니다.",
      });
    }

    const { token, tokenHash, expiresAt } = createCompanyMagicLinkToken();
    const magicLinkUrl = buildCompanyMagicLinkUrl(request, token);

    await prisma.companyMagicLinkToken.deleteMany({
      where: {
        companyUserId: user.id,
      },
    });

    await prisma.companyMagicLinkToken.create({
      data: {
        companyUserId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const ttlMinutes = getCompanyMagicLinkTtlMinutes();
    const title = "[관리자 시스템] Company 로그인 링크 안내";
    const bodyHtml = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#059669;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Company Console</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 20px;color:#1f2937;font-size:15px;line-height:1.6;">안녕하세요.</p>
              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.6;">아래 버튼을 클릭하면 로그인됩니다.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="${magicLinkUrl}" target="_blank" style="display:inline-block;background-color:#059669;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                      로그인하기
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">버튼이 작동하지 않으면 아래 링크를 브라우저에 직접 붙여넣으세요:</p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${magicLinkUrl}" target="_blank" style="color:#059669;font-size:12px;text-decoration:underline;">${magicLinkUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                이 링크는 <strong>${ttlMinutes}분</strong> 동안 유효하며 1회만 사용할 수 있습니다.<br/>
                본인이 요청하지 않았다면 이 메일을 무시해주세요.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
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
      to: user.email,
      title,
      body: bodyHtml,
    });

    return NextResponse.json({
      message: "입력한 이메일로 로그인 링크를 전송했습니다.",
    });
  } catch (error) {
    console.error("Company login error:", error);
    return NextResponse.json(
      { error: "로그인 링크 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
