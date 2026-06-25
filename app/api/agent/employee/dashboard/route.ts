import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

async function requireAgentAuth(request: NextRequest) {
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

/**
 * GET /api/agent/employee/dashboard
 *
 * Returns per-company employee registration summary for the agent organization.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const companies = await prisma.company.findMany({
      where: {
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
      },
      orderBy: { businessName: "asc" },
    });

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalCompanies: 0,
          companiesWithEmployees: 0,
          companiesFullyPublished: 0,
          totalEmployees: 0,
          totalActiveEmployees: 0,
          totalResignedEmployees: 0,
          totalSavedEmployees: 0,
          totalPublishedEmployees: 0,
        },
        companies: [],
      });
    }

    const companyIds = companies.map((c) => c.id);

    // Count employees per company (active = no resignDate or deletedAt)
    const employees = await prisma.employee.findMany({
      where: { companyId: { in: companyIds }, deletedAt: null },
      select: {
        companyId: true,
        resignDate: true,
        publishStatus: true,
      },
    });

    const businessIncomeEmployees =
      await prisma.businessIncomeEmployee.findMany({
        where: { companyId: { in: companyIds }, deletedAt: null },
        select: {
          companyId: true,
          resignDate: true,
          publishStatus: true,
        },
      });

    const otherIncomeEmployees = await prisma.otherIncomeEmployee.findMany({
      where: { companyId: { in: companyIds }, deletedAt: null },
      select: {
        companyId: true,
        resignDate: true,
        publishStatus: true,
      },
    });

    const otherIncomeLaborEmployees =
      await prisma.otherIncomeLaborEmployee.findMany({
        where: { companyId: { in: companyIds }, deletedAt: null },
        select: {
          companyId: true,
          resignDate: true,
          publishStatus: true,
        },
      });

    type EmpCounts = {
      earned: {
        active: number;
        resigned: number;
        saved: number;
        published: number;
      };
      business: {
        active: number;
        resigned: number;
        saved: number;
        published: number;
      };
      other: {
        active: number;
        resigned: number;
        saved: number;
        published: number;
      };
      dailyLabor: {
        active: number;
        resigned: number;
        saved: number;
        published: number;
      };
    };

    const countMap = new Map<string, EmpCounts>();

    function ensureEntry(companyId: string): EmpCounts {
      const key = companyId.toString();
      if (!countMap.has(key)) {
        countMap.set(key, {
          earned: { active: 0, resigned: 0, saved: 0, published: 0 },
          business: { active: 0, resigned: 0, saved: 0, published: 0 },
          other: { active: 0, resigned: 0, saved: 0, published: 0 },
          dailyLabor: { active: 0, resigned: 0, saved: 0, published: 0 },
        });
      }
      return countMap.get(key)!;
    }

    for (const e of employees) {
      const entry = ensureEntry(e.companyId);
      if (e.resignDate) {
        entry.earned.resigned++;
      } else {
        entry.earned.active++;
      }
      if (e.publishStatus === "PUBLISHED") {
        entry.earned.published++;
      } else {
        entry.earned.saved++;
      }
    }

    for (const e of businessIncomeEmployees) {
      const entry = ensureEntry(e.companyId);
      if (e.resignDate) {
        entry.business.resigned++;
      } else {
        entry.business.active++;
      }
      if (e.publishStatus === "PUBLISHED") {
        entry.business.published++;
      } else {
        entry.business.saved++;
      }
    }

    for (const e of otherIncomeEmployees) {
      const entry = ensureEntry(e.companyId);
      if (e.resignDate) {
        entry.other.resigned++;
      } else {
        entry.other.active++;
      }
      if (e.publishStatus === "PUBLISHED") {
        entry.other.published++;
      } else {
        entry.other.saved++;
      }
    }

    for (const e of otherIncomeLaborEmployees) {
      const entry = ensureEntry(e.companyId);
      if (e.resignDate) {
        entry.dailyLabor.resigned++;
      } else {
        entry.dailyLabor.active++;
      }
      if (e.publishStatus === "PUBLISHED") {
        entry.dailyLabor.published++;
      } else {
        entry.dailyLabor.saved++;
      }
    }

    let totalEmployees = 0;
    let totalActiveEmployees = 0;
    let totalResignedEmployees = 0;
    let totalSavedEmployees = 0;
    let totalPublishedEmployees = 0;
    let companiesWithEmployees = 0;
    let companiesFullyPublished = 0;

    const companyResults = companies.map((company) => {
      const key = company.id.toString();
      const counts = countMap.get(key) ?? {
        earned: { active: 0, resigned: 0, saved: 0, published: 0 },
        business: { active: 0, resigned: 0, saved: 0, published: 0 },
        other: { active: 0, resigned: 0, saved: 0, published: 0 },
        dailyLabor: { active: 0, resigned: 0, saved: 0, published: 0 },
      };

      const incomeTypes = [
        {
          type: "EARNED_INCOME" as const,
          label: "근로소득",
          activeCount: counts.earned.active,
          resignedCount: counts.earned.resigned,
          totalCount: counts.earned.active + counts.earned.resigned,
          savedCount: counts.earned.saved,
          publishedCount: counts.earned.published,
        },
        {
          type: "BUSINESS_INCOME" as const,
          label: "사업소득",
          activeCount: counts.business.active,
          resignedCount: counts.business.resigned,
          totalCount: counts.business.active + counts.business.resigned,
          savedCount: counts.business.saved,
          publishedCount: counts.business.published,
        },
        {
          type: "OTHER_INCOME" as const,
          label: "기타소득",
          activeCount: counts.other.active,
          resignedCount: counts.other.resigned,
          totalCount: counts.other.active + counts.other.resigned,
          savedCount: counts.other.saved,
          publishedCount: counts.other.published,
        },
        {
          type: "OTHER_INCOME_LABOR" as const,
          label: "일용소득",
          activeCount: counts.dailyLabor.active,
          resignedCount: counts.dailyLabor.resigned,
          totalCount: counts.dailyLabor.active + counts.dailyLabor.resigned,
          savedCount: counts.dailyLabor.saved,
          publishedCount: counts.dailyLabor.published,
        },
      ];

      const companyTotal = incomeTypes.reduce(
        (sum, it) => sum + it.totalCount,
        0,
      );
      const companyActive = incomeTypes.reduce(
        (sum, it) => sum + it.activeCount,
        0,
      );
      const companyResigned = incomeTypes.reduce(
        (sum, it) => sum + it.resignedCount,
        0,
      );
      const companySaved = incomeTypes.reduce(
        (sum, it) => sum + it.savedCount,
        0,
      );
      const companyPublished = incomeTypes.reduce(
        (sum, it) => sum + it.publishedCount,
        0,
      );

      // 직원이 있는 소득유형 중, 모두 발행되었는지 확인
      const typesWithEmployees = incomeTypes.filter((it) => it.totalCount > 0);
      const isFullyPublished =
        typesWithEmployees.length > 0 &&
        typesWithEmployees.every((it) => it.savedCount === 0);
      const hasUnpublished = companySaved > 0;

      totalEmployees += companyTotal;
      totalActiveEmployees += companyActive;
      totalResignedEmployees += companyResigned;
      totalSavedEmployees += companySaved;
      totalPublishedEmployees += companyPublished;
      if (companyTotal > 0) companiesWithEmployees++;
      if (isFullyPublished) companiesFullyPublished++;

      return {
        id: company.id.toString(),
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessName: company.businessName,
        representativeName: company.representativeName,
        totalCount: companyTotal,
        activeCount: companyActive,
        resignedCount: companyResigned,
        savedCount: companySaved,
        publishedCount: companyPublished,
        hasEmployees: companyTotal > 0,
        isFullyPublished,
        hasUnpublished,
        incomeTypes,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalCompanies: companies.length,
        companiesWithEmployees,
        companiesFullyPublished,
        totalEmployees,
        totalActiveEmployees,
        totalResignedEmployees,
        totalSavedEmployees,
        totalPublishedEmployees,
      },
      companies: companyResults,
    });
  } catch (error) {
    console.error("Employee dashboard error:", error);
    return NextResponse.json(
      { error: "직원 현황 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
