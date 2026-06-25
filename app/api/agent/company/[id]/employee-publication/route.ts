import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  SALARY_INCOME_TYPE_LABELS,
  SALARY_INCOME_TYPES,
} from "@/catalogs/ko/salary";

type IncomeType =
  | "EARNED_INCOME"
  | "BUSINESS_INCOME"
  | "OTHER_INCOME"
  | "OTHER_INCOME_LABOR";

type PublishStatus = "SAVED" | "PUBLISHED";

const ALL_INCOME_TYPES: IncomeType[] = SALARY_INCOME_TYPES;

function parseCompanyId(id: string) {
  try {
    return { companyId: id } as const;
  } catch {
    return { error: "유효한 거래처 ID가 아닙니다." } as const;
  }
}

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

async function ensureCompanyAccess(companyId: string, organizationId: string) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      organizationLink: { is: { agentOrganizationId: organizationId } },
    },
    select: { id: true },
  });
  return Boolean(company);
}

type EmployeeRow = {
  id: string;
  employeeCode: string | null;
  name: string;
  department: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  resignDate: string | null;
  publishStatus: PublishStatus;
  createdAt: string;
};

type IncomeTypeGroup = {
  incomeType: IncomeType;
  incomeTypeLabel: string;
  employees: EmployeeRow[];
  totalCount: number;
  savedCount: number;
  publishedCount: number;
};

async function buildSnapshot(companyId: string) {
  // Fetch all 4 employee models in parallel
  const [earned, business, other, labor] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        department: true,
        positionTitle: true,
        hireDate: true,
        resignDate: true,
        publishStatus: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.businessIncomeEmployee.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        department: true,
        positionTitle: true,
        hireDate: true,
        resignDate: true,
        publishStatus: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.otherIncomeEmployee.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        department: true,
        positionTitle: true,
        hireDate: true,
        resignDate: true,
        publishStatus: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    prisma.otherIncomeLaborEmployee.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        department: true,
        positionTitle: true,
        hireDate: true,
        resignDate: true,
        publishStatus: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
  ]);

  function serialize(rows: typeof earned): EmployeeRow[] {
    return rows.map((r) => ({
      id: r.id.toString(),
      employeeCode: r.employeeCode,
      name: r.name,
      department: r.department,
      positionTitle: r.positionTitle,
      hireDate: r.hireDate,
      resignDate: r.resignDate,
      publishStatus: r.publishStatus as PublishStatus,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  const dataMap: Record<IncomeType, typeof earned> = {
    EARNED_INCOME: earned,
    BUSINESS_INCOME: business,
    OTHER_INCOME: other,
    OTHER_INCOME_LABOR: labor,
  };

  const groups: IncomeTypeGroup[] = ALL_INCOME_TYPES.map((type) => {
    const rows = dataMap[type];
    const employees = serialize(rows);
    return {
      incomeType: type,
      incomeTypeLabel: SALARY_INCOME_TYPE_LABELS[type],
      employees,
      totalCount: employees.length,
      savedCount: employees.filter((e) => e.publishStatus === "SAVED").length,
      publishedCount: employees.filter((e) => e.publishStatus === "PUBLISHED")
        .length,
    };
  });

  const totalCount = groups.reduce((s, g) => s + g.totalCount, 0);
  const savedCount = groups.reduce((s, g) => s + g.savedCount, 0);
  const publishedCount = groups.reduce((s, g) => s + g.publishedCount, 0);

  return { groups, totalCount, savedCount, publishedCount };
}

// GET: 직원 발행 상태 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hasAccess = await ensureCompanyAccess(
      parsed.companyId,
      auth.organizationId,
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const snapshot = await buildSnapshot(parsed.companyId);

    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    console.error("Agent employee publication GET error:", error);
    return NextResponse.json(
      { error: "직원 발행 상태를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

// POST: 직원 발행 상태 변경
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hasAccess = await ensureCompanyAccess(
      parsed.companyId,
      auth.organizationId,
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const action =
      body && typeof body.action === "string" ? body.action.trim() : "";

    if (action === "setEmployeeStatus") {
      // 개별 직원 상태 변경
      const employeeIdRaw =
        body && typeof body.employeeId === "string"
          ? body.employeeId.trim()
          : "";
      const incomeType =
        body && typeof body.incomeType === "string"
          ? (body.incomeType.trim() as IncomeType)
          : null;
      const publishStatus =
        body && typeof body.publishStatus === "string"
          ? (body.publishStatus.trim() as PublishStatus)
          : null;

      if (!employeeIdRaw) {
        return NextResponse.json(
          { error: "직원을 선택해주세요." },
          { status: 400 },
        );
      }

      if (!incomeType || !ALL_INCOME_TYPES.includes(incomeType)) {
        return NextResponse.json(
          { error: "유효한 소득유형을 선택해주세요." },
          { status: 400 },
        );
      }

      if (publishStatus !== "SAVED" && publishStatus !== "PUBLISHED") {
        return NextResponse.json(
          { error: "변경할 상태가 올바르지 않습니다." },
          { status: 400 },
        );
      }

      let employeeId: string;
      try {
        employeeId = employeeIdRaw;
      } catch {
        return NextResponse.json(
          { error: "유효한 직원 ID가 아닙니다." },
          { status: 400 },
        );
      }

      if (incomeType === "EARNED_INCOME") {
        await prisma.employee.updateMany({
          where: {
            id: employeeId,
            companyId: parsed.companyId,
            deletedAt: null,
          },
          data: { publishStatus },
        });
      } else if (incomeType === "BUSINESS_INCOME") {
        await prisma.businessIncomeEmployee.updateMany({
          where: {
            id: employeeId,
            companyId: parsed.companyId,
            deletedAt: null,
          },
          data: { publishStatus },
        });
      } else if (incomeType === "OTHER_INCOME") {
        await prisma.otherIncomeEmployee.updateMany({
          where: {
            id: employeeId,
            companyId: parsed.companyId,
            deletedAt: null,
          },
          data: { publishStatus },
        });
      } else if (incomeType === "OTHER_INCOME_LABOR") {
        await prisma.otherIncomeLaborEmployee.updateMany({
          where: {
            id: employeeId,
            companyId: parsed.companyId,
            deletedAt: null,
          },
          data: { publishStatus },
        });
      }

      const snapshot = await buildSnapshot(parsed.companyId);
      return NextResponse.json({ success: true, ...snapshot });
    }

    if (action === "setBulkStatus") {
      // 소득유형별 일괄 상태 변경
      const incomeType =
        body && typeof body.incomeType === "string"
          ? (body.incomeType.trim() as IncomeType)
          : null;
      const publishStatus =
        body && typeof body.publishStatus === "string"
          ? (body.publishStatus.trim() as PublishStatus)
          : null;

      if (!incomeType || !ALL_INCOME_TYPES.includes(incomeType)) {
        return NextResponse.json(
          { error: "유효한 소득유형을 선택해주세요." },
          { status: 400 },
        );
      }

      if (publishStatus !== "SAVED" && publishStatus !== "PUBLISHED") {
        return NextResponse.json(
          { error: "변경할 상태가 올바르지 않습니다." },
          { status: 400 },
        );
      }

      const oppositeStatus: PublishStatus =
        publishStatus === "PUBLISHED" ? "SAVED" : "PUBLISHED";

      if (incomeType === "EARNED_INCOME") {
        await prisma.employee.updateMany({
          where: {
            companyId: parsed.companyId,
            deletedAt: null,
            publishStatus: oppositeStatus,
          },
          data: { publishStatus },
        });
      } else if (incomeType === "BUSINESS_INCOME") {
        await prisma.businessIncomeEmployee.updateMany({
          where: {
            companyId: parsed.companyId,
            deletedAt: null,
            publishStatus: oppositeStatus,
          },
          data: { publishStatus },
        });
      } else if (incomeType === "OTHER_INCOME") {
        await prisma.otherIncomeEmployee.updateMany({
          where: {
            companyId: parsed.companyId,
            deletedAt: null,
            publishStatus: oppositeStatus,
          },
          data: { publishStatus },
        });
      } else if (incomeType === "OTHER_INCOME_LABOR") {
        await prisma.otherIncomeLaborEmployee.updateMany({
          where: {
            companyId: parsed.companyId,
            deletedAt: null,
            publishStatus: oppositeStatus,
          },
          data: { publishStatus },
        });
      }

      const snapshot = await buildSnapshot(parsed.companyId);
      return NextResponse.json({ success: true, ...snapshot });
    }

    return NextResponse.json(
      { error: "지원하지 않는 액션입니다." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Agent employee publication POST error:", error);
    return NextResponse.json(
      { error: "직원 발행 상태 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
