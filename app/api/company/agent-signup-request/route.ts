import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { buildUrlForAudience } from "@/app/lib/audience-routing";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import { sendEmail } from "@/app/lib/messages/email";
import { MessageSendValidationError } from "@/app/lib/messages/shared";
import { sendSms } from "@/app/lib/messages/sms";
import { formatBusinessNumber } from "@/app/lib/formatters";

type AgentSignupRequestBody = {
  contactType?: unknown;
  contact?: unknown;
};

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCompanyLabel(company: {
  businessName: string | null;
  businessNumber: string;
}) {
  return (
    company.businessName?.trim() || formatBusinessNumber(company.businessNumber)
  );
}

function buildEmailBody(params: {
  companyLabel: string;
  businessNumber: string;
  agentLoginUrl: string;
}) {
  const companyLabel = escapeHtml(params.companyLabel);
  const businessNumber = escapeHtml(
    formatBusinessNumber(params.businessNumber),
  );
  const agentLoginUrl = escapeHtml(params.agentLoginUrl);

  return `
<!doctype html>
<html lang="ko">
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#059669;font-size:13px;font-weight:700;">경영한눈</p>
              <h1 style="margin:0 0 18px;color:#111827;font-size:22px;line-height:1.4;">세무대리인 가입 요청이 도착했습니다.</h1>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
                <strong>${companyLabel}</strong> 고객사가 세무사무소의 경영한눈 가입과 고객사 연결을 요청했습니다.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <th align="left" style="width:120px;background-color:#f9fafb;padding:12px;color:#6b7280;font-size:13px;font-weight:600;">회사명</th>
                  <td style="padding:12px;color:#111827;font-size:14px;">${companyLabel}</td>
                </tr>
                <tr>
                  <th align="left" style="width:120px;background-color:#f9fafb;padding:12px;color:#6b7280;font-size:13px;font-weight:600;border-top:1px solid #e5e7eb;">사업자번호</th>
                  <td style="padding:12px;color:#111827;font-size:14px;border-top:1px solid #e5e7eb;">${businessNumber}</td>
                </tr>
              </table>
              <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.7;">
                경영한눈에 가입 또는 로그인한 뒤 해당 고객사를 연결해주세요.
              </p>
              <p style="margin:0 0 18px;">
                <a href="${agentLoginUrl}" target="_blank" style="display:inline-block;border-radius:10px;background-color:#059669;padding:12px 18px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">세무대리인으로 로그인</a>
              </p>
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">버튼이 작동하지 않으면 아래 링크를 직접 열어주세요.</p>
              <p style="margin:4px 0 0;word-break:break-all;"><a href="${agentLoginUrl}" target="_blank" style="color:#2563eb;font-size:12px;text-decoration:underline;">${agentLoginUrl}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request
      .json()
      .catch(() => ({}))) as AgentSignupRequestBody;
    const contactType = body.contactType;
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";

    if (contactType !== "email" && contactType !== "phone") {
      return NextResponse.json(
        { error: "발송 방식을 선택해주세요." },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: auth.currentCompanyId },
      select: {
        businessName: true,
        businessNumber: true,
        organizationLink: {
          select: {
            agentOrganizationId: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "회사 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (company.organizationLink?.agentOrganizationId) {
      return NextResponse.json(
        { error: "이미 담당 세무대리인이 지정되어 있습니다." },
        { status: 409 },
      );
    }

    const companyLabel = getCompanyLabel(company);
    const agentLoginUrl = buildUrlForAudience("agent", "/auth/login", request);

    if (contactType === "email") {
      await sendEmail({
        to: contact,
        title: `[경영한눈] ${companyLabel} 고객사로부터 세무대리인 가입 요청이 왔습니다`,
        body: buildEmailBody({
          companyLabel,
          businessNumber: company.businessNumber,
          agentLoginUrl,
        }),
      });

      await prisma.companyAgentSignupRequestHistory.create({
        data: {
          companyId: auth.currentCompanyId,
          contactType,
          contact,
        },
      });

      return NextResponse.json({
        message: `${contact} 주소로 가입 요청 메일을 발송했습니다.`,
      });
    }

    await sendSms({
      to: contact,
      subject: `${companyLabel} 가입 요청`,
      content: [
        `[경영한눈] ${companyLabel} 사업주가 세무대리인 가입을 요청했습니다.`,
        "경영한눈에 가입 후 해당 고객사를 연결해주세요.",
        agentLoginUrl,
      ].join("\n"),
    });

    await prisma.companyAgentSignupRequestHistory.create({
      data: {
        companyId: auth.currentCompanyId,
        contactType,
        contact,
      },
    });

    return NextResponse.json({
      message: `${contact} 번호로 가입 요청 문자를 발송했습니다.`,
    });
  } catch (error) {
    if (error instanceof MessageSendValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Agent signup request send error:", error);
    return NextResponse.json(
      { error: "가입 요청 발송 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
