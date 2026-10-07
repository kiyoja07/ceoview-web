import { NextRequest, NextResponse } from "next/server";
import { authorizeCompanySalaryAccess } from "@/app/lib/company-salary-access";
import prisma from "@/app/lib/prisma";
import {
  buildPayslipViewUrl,
  createPayslipAccessToken,
  getPayslipAccessTtlHours,
} from "@/app/lib/payslip-access";
import {
  DEFAULT_PAYSLIP_SEND_CHANNELS,
  filterPayslipChannelsForRecipient,
  sanitizeRequestedPayslipChannels,
  type PayslipSendChannel,
} from "@/app/lib/payslip-delivery";
import { buildEarnedPayslipData } from "@/app/lib/payslip-earned";
import { resolveUploadForCompanyView } from "@/app/lib/salary-upload-view";
import { formatNumber } from "@/app/company/[id]/salary/lib/format";
import { renderPayslipHtml } from "@/app/company/[id]/salary/lib/payslip-template";
import { sendEmail } from "@/app/lib/messages/email";
import { sendKakaoMessage } from "@/app/lib/messages/kakao";
import { sendSms } from "@/app/lib/messages/sms";

function buildPayslipMobileContent({
  companyName,
  employeeName,
  accrualYm,
  totalPayment,
  totalDeduction,
  netPayment,
  viewUrl,
}: {
  companyName: string;
  employeeName: string;
  accrualYm: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  viewUrl: string;
}) {
  return `[급여명세서 (${accrualYm})]
${companyName}
${employeeName}님

지급액: ${formatNumber(totalPayment)}원
공제액: ${formatNumber(totalDeduction)}원
실수령액: ${formatNumber(netPayment)}원

급여 명세서 링크: ${viewUrl}

링크는 ${getPayslipAccessTtlHours()}시간 내 1회만 열람할 수 있습니다.`;
}

function buildPayslipEmailHtml(params: {
  companyName: string;
  employeeName: string;
  accrualYm: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  viewUrl: string;
  payslipHtml: string;
}) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="720" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#ffffff;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;opacity:0.9;">급여명세서 안내</p>
              <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;">${params.employeeName}님 ${params.accrualYm} 급여명세서</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.6;opacity:0.92;">메일 본문에서 급여명세서를 확인할 수 있고, 아래 버튼으로 웹 화면에 들어가 직원 계정을 만들 수 있습니다.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 10px;">
                <tr>
                  <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#334155;">회사명</td>
                  <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#0f172a;font-weight:600;">${params.companyName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#334155;">지급액</td>
                  <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#0f172a;font-weight:600;">${formatNumber(params.totalPayment)}원</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#334155;">공제액</td>
                  <td style="padding:14px 16px;background-color:#f8fafc;border-radius:12px;font-size:14px;color:#0f172a;font-weight:600;">${formatNumber(params.totalDeduction)}원</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:#eff6ff;border-radius:12px;font-size:14px;color:#1d4ed8;">실수령액</td>
                  <td style="padding:14px 16px;background-color:#eff6ff;border-radius:12px;font-size:16px;color:#1d4ed8;font-weight:700;">${formatNumber(params.netPayment)}원</td>
                </tr>
              </table>

              <div style="margin:24px 0 0;padding:20px;border:1px solid #dbeafe;border-radius:16px;background-color:#f8fbff;text-align:center;">
                <p style="margin:0 0 10px;font-size:14px;color:#334155;">웹 화면에서 PDF 다운로드와 직원 계정 생성을 진행할 수 있습니다.</p>
                <a href="${params.viewUrl}" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
                  웹에서 확인 / 직원 계정 만들기
                </a>
                <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
                  링크는 ${getPayslipAccessTtlHours()}시간 동안 유효하며 1회만 사용할 수 있습니다.
                </p>
              </div>

              <div style="margin:24px 0 0;padding:20px;border-top:1px solid #e5e7eb;">
                ${params.payslipHtml}
              </div>

              <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
                버튼이 동작하지 않으면 아래 링크를 브라우저에 붙여넣으세요.<br />
                <a href="${params.viewUrl}" target="_blank" style="color:#2563eb;word-break:break-all;">${params.viewUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function logPayslipNotification(params: {
  earnedIncomeId: string;
  channel: PayslipSendChannel;
  recipient: string;
  status: "SENT" | "FAILED";
  errorMessage?: string;
}) {
  await prisma.payslipNotification.create({
    data: {
      earnedIncomeId: params.earnedIncomeId,
      channel: params.channel,
      recipient: params.recipient,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
    },
  });
}

async function issuePayslipAccessLink(params: {
  request: NextRequest;
  earnedIncomeId: string;
  channel: PayslipSendChannel;
  recipient: string;
}) {
  const { token, tokenHash, expiresAt } = createPayslipAccessToken();
  const now = new Date();

  const accessToken = await prisma.$transaction(async (tx) => {
    await tx.payslipAccessToken.updateMany({
      where: {
        earnedIncomeId: params.earnedIncomeId,
        channel: params.channel,
        recipient: params.recipient,
        AND: [
          { OR: [{ usedAt: null }, { usedAt: { isSet: false } }] },
          { OR: [{ revokedAt: null }, { revokedAt: { isSet: false } }] },
        ],
      },
      data: { revokedAt: now },
    });

    return tx.payslipAccessToken.create({
      data: {
        earnedIncomeId: params.earnedIncomeId,
        channel: params.channel,
        recipient: params.recipient,
        tokenHash,
        expiresAt,
      },
    });
  });

  return {
    tokenId: accessToken.id,
    viewUrl: buildPayslipViewUrl(params.request, token),
  };
}

async function revokePayslipAccessToken(tokenId: string) {
  await prisma.payslipAccessToken.updateMany({
    where: {
      id: tokenId,
      AND: [
        { OR: [{ usedAt: null }, { usedAt: { isSet: false } }] },
        { OR: [{ revokedAt: null }, { revokedAt: { isSet: false } }] },
      ],
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const companyId = id;

    const access = await authorizeCompanySalaryAccess(request, companyId);
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = await request.json();
    const { earnedIncomeIds, channels } = body as {
      earnedIncomeIds: string[];
      channels?: PayslipSendChannel[];
    };

    if (
      !earnedIncomeIds ||
      !Array.isArray(earnedIncomeIds) ||
      earnedIncomeIds.length === 0
    ) {
      return NextResponse.json(
        { error: "발송할 급여 데이터를 선택해주세요." },
        { status: 400 },
      );
    }

    if (earnedIncomeIds.length > 500) {
      return NextResponse.json(
        { error: "한 번에 최대 500건까지 발송할 수 있습니다." },
        { status: 400 },
      );
    }

    const requestedChannels = sanitizeRequestedPayslipChannels(channels);
    if (requestedChannels.length === 0) {
      return NextResponse.json(
        { error: "발송 채널을 하나 이상 선택해주세요." },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, businessName: true, businessNumber: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "사업자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const uploadView = await resolveUploadForCompanyView(
      request,
      companyId,
      "EARNED_INCOME",
    );

    if (!uploadView.uploadId) {
      return NextResponse.json(
        { error: "업로드된 급여 데이터가 없습니다." },
        { status: 404 },
      );
    }

    const rows = await prisma.earnedIncome.findMany({
      where: {
        id: { in: earnedIncomeIds.map((value) => value) },
        uploadId: uploadView.uploadId,
      },
      include: {
        employee: {
          select: { email: true, phone: true },
        },
        itemValues: {
          include: {
            itemDefinition: {
              select: { name: true, kind: true },
            },
          },
        },
      },
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "발송할 급여 데이터를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const unlinkedCodes = [
      ...new Set(
        rows.filter((row) => !row.employee).map((row) => row.employeeCode),
      ),
    ];
    const employeeByCode = new Map<
      string,
      { email: string | null; phone: string | null }
    >();
    if (unlinkedCodes.length > 0) {
      const employees = await prisma.employee.findMany({
        where: {
          companyId,
          employeeCode: { in: unlinkedCodes },
          deletedAt: null,
        },
        select: { employeeCode: true, email: true, phone: true },
      });
      for (const employee of employees) {
        if (employee.employeeCode) {
          employeeByCode.set(employee.employeeCode, {
            email: employee.email,
            phone: employee.phone,
          });
        }
      }
    }

    const companyName = company.businessName ?? "회사";
    const results: {
      earnedIncomeId: string;
      employeeName: string;
      emailSent: boolean;
      smsSent: boolean;
      kakaoSent: boolean;
      attemptedChannels: PayslipSendChannel[];
      error?: string;
    }[] = [];

    for (const row of rows) {
      const fallback = employeeByCode.get(row.employeeCode);
      const email = row.employee?.email ?? fallback?.email ?? null;
      const phone = row.employee?.phone ?? fallback?.phone ?? null;
      const recipientChannels = filterPayslipChannelsForRecipient(
        requestedChannels,
        { email, phone },
      );

      if (recipientChannels.length === 0) {
        const availableChannels = filterPayslipChannelsForRecipient(
          DEFAULT_PAYSLIP_SEND_CHANNELS,
          { email, phone },
        );
        results.push({
          earnedIncomeId: row.id.toString(),
          employeeName: row.employeeName,
          emailSent: false,
          smsSent: false,
          kakaoSent: false,
          attemptedChannels: requestedChannels,
          error:
            availableChannels.length === 0
              ? "이메일 또는 전화번호가 등록되어 있지 않습니다."
              : "선택한 발송 채널에 맞는 연락처가 없습니다.",
        });
        continue;
      }

      const payslipData = buildEarnedPayslipData(row, {
        businessName: company.businessName,
        businessNumber: company.businessNumber,
      });

      let emailSent = false;
      let smsSent = false;
      let kakaoSent = false;
      const errors: string[] = [];

      if (email && recipientChannels.includes("EMAIL")) {
        let issuedTokenId: string | null = null;
        try {
          const { tokenId, viewUrl } = await issuePayslipAccessLink({
            request,
            earnedIncomeId: row.id,
            channel: "EMAIL",
            recipient: email,
          });
          issuedTokenId = tokenId;

          await sendEmail({
            to: email,
            title: `[${companyName}] ${payslipData.accrualYm} 급여명세서 - ${row.employeeName}`,
            body: buildPayslipEmailHtml({
              companyName,
              employeeName: row.employeeName,
              accrualYm: payslipData.accrualYm,
              totalPayment: payslipData.totalPayment,
              totalDeduction: payslipData.totalDeduction,
              netPayment: payslipData.netPayment,
              viewUrl,
              payslipHtml: renderPayslipHtml(payslipData),
            }),
          });
          emailSent = true;
          await logPayslipNotification({
            earnedIncomeId: row.id,
            channel: "EMAIL",
            recipient: email,
            status: "SENT",
          });
        } catch (error) {
          console.error(`이메일 발송 실패 (${row.employeeName}):`, error);
          if (issuedTokenId) await revokePayslipAccessToken(issuedTokenId);
          errors.push("이메일 발송 실패");
          await logPayslipNotification({
            earnedIncomeId: row.id,
            channel: "EMAIL",
            recipient: email,
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 500) : undefined,
          });
        }
      }

      if (phone && recipientChannels.includes("SMS")) {
        let issuedTokenId: string | null = null;
        try {
          const { tokenId, viewUrl } = await issuePayslipAccessLink({
            request,
            earnedIncomeId: row.id,
            channel: "SMS",
            recipient: phone,
          });
          issuedTokenId = tokenId;

          await sendSms({
            to: phone,
            content: buildPayslipMobileContent({
              companyName,
              employeeName: row.employeeName,
              accrualYm: payslipData.accrualYm,
              totalPayment: payslipData.totalPayment,
              totalDeduction: payslipData.totalDeduction,
              netPayment: payslipData.netPayment,
              viewUrl,
            }),
            subject: `급여명세서 - ${payslipData.accrualYm}`,
          });
          smsSent = true;
          await logPayslipNotification({
            earnedIncomeId: row.id,
            channel: "SMS",
            recipient: phone,
            status: "SENT",
          });
        } catch (error) {
          console.error(`SMS 발송 실패 (${row.employeeName}):`, error);
          if (issuedTokenId) await revokePayslipAccessToken(issuedTokenId);
          errors.push("SMS 발송 실패");
          await logPayslipNotification({
            earnedIncomeId: row.id,
            channel: "SMS",
            recipient: phone,
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 500) : undefined,
          });
        }
      }

      if (phone && recipientChannels.includes("KAKAO")) {
        let issuedTokenId: string | null = null;
        try {
          const { tokenId, viewUrl } = await issuePayslipAccessLink({
            request,
            earnedIncomeId: row.id,
            channel: "KAKAO",
            recipient: phone,
          });
          issuedTokenId = tokenId;

          const body = buildPayslipMobileContent({
            companyName,
            employeeName: row.employeeName,
            accrualYm: payslipData.accrualYm,
            totalPayment: payslipData.totalPayment,
            totalDeduction: payslipData.totalDeduction,
            netPayment: payslipData.netPayment,
            viewUrl,
          });

          await sendKakaoMessage({
            to: phone,
            body,
            buttons: [
              {
                type: "WL",
                name: "급여명세서 보기",
                mobileUrl: viewUrl,
                pcUrl: viewUrl,
              },
            ],
          });
          kakaoSent = true;
          await logPayslipNotification({
            earnedIncomeId: row.id,
            channel: "KAKAO",
            recipient: phone,
            status: "SENT",
          });
        } catch (error) {
          console.error(`카카오톡 발송 실패 (${row.employeeName}):`, error);
          if (issuedTokenId) await revokePayslipAccessToken(issuedTokenId);
          errors.push("카카오톡 발송 실패");
          await logPayslipNotification({
            earnedIncomeId: row.id,
            channel: "KAKAO",
            recipient: phone,
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 500) : undefined,
          });
        }
      }

      results.push({
        earnedIncomeId: row.id.toString(),
        employeeName: row.employeeName,
        emailSent,
        smsSent,
        kakaoSent,
        attemptedChannels: recipientChannels,
        error: errors.length > 0 ? errors.join(", ") : undefined,
      });
    }

    const successCount = results.filter(
      (result) => result.emailSent || result.smsSent || result.kakaoSent,
    ).length;
    const failCount = results.filter(
      (result) => !result.emailSent && !result.smsSent && !result.kakaoSent,
    ).length;

    return NextResponse.json({
      success: true,
      totalRequested: rows.length,
      channels: requestedChannels,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("급여명세서 발송 실패:", error);
    return NextResponse.json(
      { error: "급여명세서 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
