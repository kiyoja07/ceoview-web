import type { Metadata } from "next";
import { formatEmployeePhone } from "@/app/lib/employee-contact";
import { createEmployeeSignupGrant } from "@/app/lib/employee-signup-grant";
import prisma from "@/app/lib/prisma";
import { hashPayslipAccessToken } from "@/app/lib/payslip-access";
import { buildEarnedPayslipData } from "@/app/lib/payslip-earned";
import { PayslipViewer } from "./PayslipViewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "급여명세서 열람",
  robots: {
    index: false,
    follow: false,
  },
};

function InvalidPayslipView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-950/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm9-3.758a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
      </div>
    </main>
  );
}

function maskEmail(value: string) {
  const [localPart, domain = ""] = value.split("@");
  if (!localPart) return value;

  const visible = localPart.slice(0, 2);
  const masked = `${visible}${"*".repeat(Math.max(localPart.length - visible.length, 1))}`;
  return domain ? `${masked}@${domain}` : masked;
}

function maskPhone(value: string) {
  const formatted = formatEmployeePhone(value);
  const digits = formatted.replace(/\D/g, "");
  if (digits.length < 4) return formatted;
  return formatted.replace(digits.slice(-4), "****");
}

export default async function PayslipViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const normalizedToken = token?.trim();

  if (!normalizedToken) {
    return (
      <InvalidPayslipView
        title="유효하지 않은 링크입니다"
        description="전달받은 링크를 다시 확인하거나 새 급여명세서 링크를 요청해 주세요."
      />
    );
  }

  const tokenHash = hashPayslipAccessToken(normalizedToken);
  const now = new Date();

  const accessToken = await prisma.payslipAccessToken.findUnique({
    where: { tokenHash },
    include: {
      earnedIncome: {
        include: {
          itemValues: {
            include: {
              itemDefinition: {
                select: { name: true, kind: true },
              },
            },
          },
          upload: {
            include: {
              company: {
                select: {
                  id: true,
                  businessName: true,
                  businessNumber: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (
    !accessToken ||
    accessToken.usedAt ||
    accessToken.revokedAt ||
    accessToken.expiresAt <= now
  ) {
    return (
      <InvalidPayslipView
        title="만료되었거나 이미 사용된 링크입니다"
        description="급여명세서 링크는 1회용이며 만료시간이 있습니다. 새 링크를 다시 발송해 주세요."
      />
    );
  }

  const markUsedResult = await prisma.payslipAccessToken.updateMany({
    where: {
      id: accessToken.id,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (markUsedResult.count !== 1) {
    return (
      <InvalidPayslipView
        title="사용할 수 없는 링크입니다"
        description="이미 열람 처리되었거나 만료된 링크입니다. 새 링크를 요청해 주세요."
      />
    );
  }

  const payslipData = buildEarnedPayslipData(accessToken.earnedIncome, {
    businessName: accessToken.earnedIncome.upload.company.businessName,
    businessNumber: accessToken.earnedIncome.upload.company.businessNumber,
  });

  const companyId = accessToken.earnedIncome.upload.company.id;
  const resolvedEmployee =
    accessToken.earnedIncome.employeeId != null
      ? await prisma.employee.findFirst({
          where: {
            id: accessToken.earnedIncome.employeeId,
            companyId,
            deletedAt: null,
          },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
          },
        })
      : await prisma.employee.findFirst({
          where: {
            companyId,
            employeeCode: accessToken.earnedIncome.employeeCode,
            deletedAt: null,
          },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
          },
        });

  const employeeAccount = resolvedEmployee?.user ?? null;
  const employeeAccountExists = Boolean(employeeAccount);
  const employeeAccountActive = employeeAccount?.isActive ?? false;
  const signupGrant =
    resolvedEmployee && !employeeAccountExists
      ? createEmployeeSignupGrant({
          employeeId: resolvedEmployee.id,
          companyId,
          recipient: accessToken.recipient,
          channel: accessToken.channel,
        })
      : null;
  const signupContactHint =
    accessToken.channel === "EMAIL"
      ? accessToken.recipient.trim().toLowerCase()
      : formatEmployeePhone(accessToken.recipient);
  const employeeLoginHint = employeeAccount?.phone
    ? `등록된 전화번호: ${maskPhone(employeeAccount.phone)}`
    : employeeAccount?.email
      ? `등록된 이메일: ${maskEmail(employeeAccount.email)}`
      : null;
  const employeeSignupUnavailableReason = resolvedEmployee
    ? null
    : "직원 정보가 연결되어 있지 않아 직원 계정을 만들 수 없습니다. 회사 담당자에게 문의해 주세요.";

  return (
    <PayslipViewer
      payslipData={payslipData}
      signupGrant={signupGrant}
      employeeAccountExists={employeeAccountExists}
      employeeAccountActive={employeeAccountActive}
      employeeLoginHint={employeeLoginHint}
      signupContactHint={signupContactHint}
      employeeSignupUnavailableReason={employeeSignupUnavailableReason}
    />
  );
}
