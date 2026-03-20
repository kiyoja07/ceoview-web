import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/password";
import { attachCompanySession } from "@/app/lib/company-auth";
import { verifyCompanyUserInviteToken } from "@/app/lib/company-user-invite";
import {
  buildCompanyMagicLinkUrl,
  createCompanyMagicLinkToken,
  createDefaultNameFromEmail,
  getCompanyMagicLinkTtlMinutes,
  isValidEmail,
} from "@/app/lib/company-magic-link";
import { sendEmail } from "@/app/lib/messages/email";
import type { CompanySignupBody } from "@/types/company/auth";

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompanySignupBody & {
      inviteToken?: string;
    };

    const inviteToken = body.inviteToken?.trim();
    const email = body.email?.trim().toLowerCase();

    // ── 초대 토큰 기반 매직링크 가입 ──
    if (inviteToken) {
      const payload = verifyCompanyUserInviteToken(inviteToken);
      if (!payload) {
        return NextResponse.json(
          { error: "초대 링크가 만료되었거나 유효하지 않습니다." },
          { status: 410 },
        );
      }

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

      let companyId: bigint;
      try {
        companyId = BigInt(payload.companyId);
      } catch {
        return NextResponse.json(
          { error: "유효하지 않은 초대 정보입니다." },
          { status: 400 },
        );
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });

      if (!company) {
        return NextResponse.json(
          { error: "초대된 거래처를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      // 이미 존재하는 사용자인지 확인, 없으면 생성
      let user = await prisma.companyUser.findUnique({
        where: { email },
        select: { id: true, email: true, isActive: true },
      });

      if (!user) {
        try {
          user = await prisma.companyUser.create({
            data: {
              companyId: company.id,
              email,
              loginProvider: "LOCAL",
              name: createDefaultNameFromEmail(email),
              isMaster: payload.role === "master",
              companyMemberships: {
                create: {
                  companyId: company.id,
                },
              },
            },
            select: { id: true, email: true, isActive: true },
          });
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            user = await prisma.companyUser.findUnique({
              where: { email },
              select: { id: true, email: true, isActive: true },
            });
          } else {
            throw error;
          }
        }
      }

      if (!user) {
        return NextResponse.json(
          { error: "계정을 생성하지 못했습니다." },
          { status: 500 },
        );
      }

      await prisma.companyUserCompany.upsert({
        where: {
          companyUserId_companyId: {
            companyUserId: user.id,
            companyId: company.id,
          },
        },
        update: {},
        create: {
          companyUserId: user.id,
          companyId: company.id,
        },
      });

      if (!user.isActive) {
        return NextResponse.json({
          message: "입력한 이메일로 로그인 링크를 전송했습니다.",
        });
      }

      // 매직 링크 생성 및 발송
      const { token, tokenHash, expiresAt } = createCompanyMagicLinkToken();
      const magicLinkUrl = buildCompanyMagicLinkUrl(request, token);

      await prisma.companyMagicLinkToken.deleteMany({
        where: { companyUserId: user.id },
      });

      await prisma.companyMagicLinkToken.create({
        data: {
          companyUserId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const ttlMinutes = getCompanyMagicLinkTtlMinutes();
      const title = "[관리자 시스템] 거래처 초대 로그인 링크 안내";
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
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">거래처 초대</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 20px;color:#1f2937;font-size:15px;line-height:1.6;">안녕하세요.</p>
              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.6;">거래처에 초대되었습니다. 아래 버튼을 클릭하면 가입 및 로그인이 완료됩니다.</p>
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
              <p style="margin:0;color:#d1d5db;font-size:11px;">&copy; ${new Date().getFullYear()} 관리자 시스템</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

      await sendEmail({
        to: user.email,
        title,
        body: bodyHtml,
      });

      return NextResponse.json({
        message:
          "입력한 이메일로 로그인 링크를 전송했습니다. 메일함을 확인해주세요.",
      });
    }

    // ── 일반 가입 (기존 로직) ──

    const password = body.password?.trim();
    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;

    const rawBusinessNumber = body.businessNumber?.trim() || "";
    const businessNumber = rawBusinessNumber.replace(/\D/g, "");
    const businessType = body.businessType;
    const businessName = body.businessName?.trim() || null;
    const representativeName = body.representativeName?.trim() || null;
    const openingDate = body.openingDate?.trim() || null;
    const address = body.address?.trim() || null;

    if (!email || !password || !name || !businessNumber || !businessType) {
      return NextResponse.json(
        {
          error: "이메일, 비밀번호, 이름, 사업자번호, 사업자구분은 필수입니다.",
        },
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

    if (businessNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 숫자 10자리여야 합니다." },
        { status: 400 },
      );
    }

    if (
      !businessType ||
      !["INDIVIDUAL", "CORPORATION"].includes(businessType)
    ) {
      return NextResponse.json(
        { error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const company =
        (await tx.company.findUnique({
          where: { businessNumber },
          select: { id: true },
        })) ||
        (await tx.company.create({
          data: {
            businessNumber,
            businessType,
            businessName,
            representativeName,
            openingDate: openingDate ? new Date(openingDate) : null,
            address,
          },
          select: { id: true },
        }));

      const existingMasterCount = await tx.companyUser.count({
        where: {
          companyId: company.id,
          isMaster: true,
        },
      });

      return tx.companyUser.create({
        data: {
          companyId: company.id,
          email,
          passwordHash,
          loginProvider: "LOCAL",
          name,
          phone,
          isMaster: existingMasterCount === 0,
          companyMemberships: {
            create: {
              companyId: company.id,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          companyId: true,
        },
      });
    });

    const response = NextResponse.json(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        companyId: user.companyId.toString(),
        redirectTo: "/company/dashboard",
      },
      { status: 201 },
    );

    attachCompanySession(response, user.id, user.companyId);
    return response;
  } catch (error: unknown) {
    console.error("Company signup error:", error);

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
