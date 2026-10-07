import { formatEmployeePhone } from "@/app/lib/employee-contact";
import { createEmployeeSignupGrant } from "@/app/lib/employee-signup-grant";
import prisma from "@/app/lib/prisma";
import { hashPayslipAccessToken } from "@/app/lib/payslip-access";
import { buildEarnedPayslipData } from "@/app/lib/payslip-earned";
import type { PayslipViewResponse } from "@/types/payslip";

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

function isUsableToken(
  token: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now: Date,
) {
  return !token.usedAt && !token.revokedAt && token.expiresAt > now;
}

/**
 * 링크가 아직 열람 가능한지 확인만 한다(소진하지 않음).
 * 메일 보안 스캐너·링크 미리보기 같은 GET 요청으로 1회용 토큰이 소진되지 않도록
 * 페이지 렌더링에서는 이 함수만 사용한다.
 */
export async function isPayslipAccessTokenUsable(token: string) {
  const accessToken = await prisma.payslipAccessToken.findUnique({
    where: { tokenHash: hashPayslipAccessToken(token) },
    select: { usedAt: true, revokedAt: true, expiresAt: true },
  });
  return Boolean(accessToken && isUsableToken(accessToken, new Date()));
}

/**
 * 1회용 토큰을 소진하고 급여명세서 열람 데이터를 만든다.
 * 사용자가 열람 버튼을 눌러 보낸 POST 요청에서만 호출한다.
 */
export async function consumePayslipAccessToken(
  token: string,
): Promise<PayslipViewResponse | null> {
  const now = new Date();
  const accessToken = await prisma.payslipAccessToken.findUnique({
    where: { tokenHash: hashPayslipAccessToken(token) },
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

  if (!accessToken || !isUsableToken(accessToken, now)) {
    return null;
  }

  const markUsedResult = await prisma.payslipAccessToken.updateMany({
    where: {
      id: accessToken.id,
      expiresAt: { gt: now },
      AND: [
        { OR: [{ usedAt: null }, { usedAt: { isSet: false } }] },
        { OR: [{ revokedAt: null }, { revokedAt: { isSet: false } }] },
      ],
    },
    data: { usedAt: now },
  });

  if (markUsedResult.count !== 1) {
    return null;
  }

  const payslipData = buildEarnedPayslipData(accessToken.earnedIncome, {
    businessName: accessToken.earnedIncome.upload.company.businessName,
    businessNumber: accessToken.earnedIncome.upload.company.businessNumber,
  });

  const companyId = accessToken.earnedIncome.upload.company.id;
  const employeeSelect = {
    id: true,
    user: {
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
      },
    },
  } as const;
  const resolvedEmployee =
    accessToken.earnedIncome.employeeId != null
      ? await prisma.employee.findFirst({
          where: {
            id: accessToken.earnedIncome.employeeId,
            companyId,
            deletedAt: null,
          },
          select: employeeSelect,
        })
      : await prisma.employee.findFirst({
          where: {
            companyId,
            employeeCode: accessToken.earnedIncome.employeeCode,
            deletedAt: null,
          },
          select: employeeSelect,
        });

  const employeeAccount = resolvedEmployee?.user ?? null;
  const employeeAccountExists = Boolean(employeeAccount);

  return {
    payslipData,
    signupGrant:
      resolvedEmployee && !employeeAccountExists
        ? createEmployeeSignupGrant({
            employeeId: resolvedEmployee.id,
            companyId,
            recipient: accessToken.recipient,
            channel: accessToken.channel,
          })
        : null,
    employeeAccountExists,
    employeeAccountActive: employeeAccount?.isActive ?? false,
    employeeLoginHint: employeeAccount?.phone
      ? `등록된 전화번호: ${maskPhone(employeeAccount.phone)}`
      : employeeAccount?.email
        ? `등록된 이메일: ${maskEmail(employeeAccount.email)}`
        : null,
    signupContactHint:
      accessToken.channel === "EMAIL"
        ? accessToken.recipient.trim().toLowerCase()
        : formatEmployeePhone(accessToken.recipient),
    employeeSignupUnavailableReason: resolvedEmployee
      ? null
      : "직원 정보가 연결되어 있지 않아 직원 계정을 만들 수 없습니다. 회사 담당자에게 문의해 주세요.",
  };
}
