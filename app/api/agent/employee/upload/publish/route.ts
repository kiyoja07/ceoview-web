import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { SALARY_INCOME_TYPE_LABELS } from "@/catalogs/ko/salary";
import type { IncomeType } from "@/types/agent/employee";

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { userId, organizationId: user.agentOrganizationId } as const;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const companyId =
      body && typeof body.companyId === "string" ? body.companyId.trim() : "";
    const incomeType =
      body && typeof body.incomeType === "string"
        ? (body.incomeType as IncomeType)
        : null;

    if (!companyId) {
      return NextResponse.json(
        { error: "사업자 ID를 입력해주세요." },
        { status: 400 },
      );
    }

    if (
      !incomeType ||
      ![
        "EARNED_INCOME",
        "BUSINESS_INCOME",
        "OTHER_INCOME",
        "OTHER_INCOME_LABOR",
      ].includes(incomeType)
    ) {
      return NextResponse.json(
        { error: "유효한 소득유형을 선택해주세요." },
        { status: 400 },
      );
    }

    let parsedCompanyId: string;
    try {
      parsedCompanyId = companyId;
    } catch {
      return NextResponse.json(
        { error: "유효한 사업자 ID가 아닙니다." },
        { status: 400 },
      );
    }

    // 권한 확인
    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId: parsedCompanyId,
        },
      },
      select: { companyId: true },
    });

    if (!companyLink) {
      return NextResponse.json(
        { error: "접근 권한이 없는 사업자입니다." },
        { status: 403 },
      );
    }

    let publishedCount = 0;

    if (incomeType === "EARNED_INCOME") {
      const result = await prisma.employee.updateMany({
        where: {
          companyId: parsedCompanyId,
          deletedAt: null,
          publishStatus: "SAVED",
        },
        data: { publishStatus: "PUBLISHED" },
      });
      publishedCount = result.count;
    } else if (incomeType === "BUSINESS_INCOME") {
      const result = await prisma.businessIncomeEmployee.updateMany({
        where: {
          companyId: parsedCompanyId,
          deletedAt: null,
          publishStatus: "SAVED",
        },
        data: { publishStatus: "PUBLISHED" },
      });
      publishedCount = result.count;
    } else if (incomeType === "OTHER_INCOME") {
      const result = await prisma.otherIncomeEmployee.updateMany({
        where: {
          companyId: parsedCompanyId,
          deletedAt: null,
          publishStatus: "SAVED",
        },
        data: { publishStatus: "PUBLISHED" },
      });
      publishedCount = result.count;
    } else if (incomeType === "OTHER_INCOME_LABOR") {
      const result = await prisma.otherIncomeLaborEmployee.updateMany({
        where: {
          companyId: parsedCompanyId,
          deletedAt: null,
          publishStatus: "SAVED",
        },
        data: { publishStatus: "PUBLISHED" },
      });
      publishedCount = result.count;
    }

    return NextResponse.json({
      success: true,
      published: true,
      publishStatus: "PUBLISHED",
      companyId,
      incomeType,
      incomeTypeLabel: SALARY_INCOME_TYPE_LABELS[incomeType],
      publishedCount,
    });
  } catch (error) {
    console.error("Employee publish error:", error);
    return NextResponse.json(
      { error: "발행 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
