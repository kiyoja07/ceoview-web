import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { sendNcloudMail } from "@/app/lib/ncloud-mailer";
import { sendNcloudSms } from "@/app/lib/ncloud-sms";
import { sendKakaoBizMessage } from "@/app/lib/kakao-bizmessage";
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

function normalizePhoneNumber(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

function buildPayslipMobileContent({
  companyName,
  employeeName,
  accrualYm,
  totalPayment,
  totalDeduction,
  netPayment,
  viewUrl,
  channel,
}: {
  companyName: string;
  employeeName: string;
  accrualYm: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  viewUrl: string;
  channel: "SMS" | "KAKAO";
}) {
  const channelLabel = channel === "KAKAO" ? "카카오톡" : "문자";
  return `[급여명세서]
${companyName}
${employeeName}님 (${accrualYm})

지급액: ${formatNumber(totalPayment)}원
공제액: ${formatNumber(totalDeduction)}원
실수령액: ${formatNumber(netPayment)}원

${channelLabel} 링크: ${viewUrl}
링크는 ${getPayslipAccessTtlHours()}시간 내 1회만 열람할 수 있습니다.`;
}

async function logPayslipNotification(params: {
  earnedIncomeId: bigint;
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
  earnedIncomeId: bigint;
  channel: "SMS" | "KAKAO";
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
        usedAt: null,
        revokedAt: null,
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

async function revokePayslipAccessToken(tokenId: bigint) {
  await prisma.payslipAccessToken.updateMany({
    where: {
      id: tokenId,
      usedAt: null,
      revokedAt: null,
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
    const companyId = BigInt(id);

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
        id: { in: earnedIncomeIds.map((value) => BigInt(value)) },
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
      ...new Set(rows.filter((row) => !row.employee).map((row) => row.employeeCode)),
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
        try {
          await sendNcloudMail({
            to: email,
            title: `[${companyName}] ${payslipData.accrualYm} 급여명세서 - ${row.employeeName}`,
            body: renderPayslipHtml(payslipData),
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
        let issuedTokenId: bigint | null = null;
        try {
          const { tokenId, viewUrl } = await issuePayslipAccessLink({
            request,
            earnedIncomeId: row.id,
            channel: "SMS",
            recipient: phone,
          });
          issuedTokenId = tokenId;

          await sendNcloudSms({
            to: normalizePhoneNumber(phone),
            content: buildPayslipMobileContent({
              companyName,
              employeeName: row.employeeName,
              accrualYm: payslipData.accrualYm,
              totalPayment: payslipData.totalPayment,
              totalDeduction: payslipData.totalDeduction,
              netPayment: payslipData.netPayment,
              viewUrl,
              channel: "SMS",
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
        let issuedTokenId: bigint | null = null;
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
            channel: "KAKAO",
          });

          await sendKakaoBizMessage({
            to: normalizePhoneNumber(phone),
            title: `${companyName} 급여명세서`,
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
