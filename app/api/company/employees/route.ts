import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  sanitizeEmployeeRequestPayload,
  sanitizeBusinessIncomeEmployeePayload,
  sanitizeOtherIncomeEmployeePayload,
  sanitizeOtherIncomeLaborEmployeePayload,
  serializePendingRequestSummary,
} from "@/app/lib/company-change-request";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import type {
  CompanyEmployeeDashboardSummary,
  EmployeeCreateBody,
  EmployeeIncomeFilter,
  BusinessIncomeEmployeeCreateBody,
  OtherIncomeEmployeeCreateBody,
  OtherIncomeLaborEmployeeCreateBody,
  EmployeeIncomeType,
  EmployeeStatusFilter,
} from "@/types/company/employees";
import { getEmployeeStatus } from "@/types/company/employees";
import {
  EMPLOYEE_INCOME_TYPE_LABELS,
  EMPLOYEE_INCOME_TYPE_OPTIONS,
} from "@/catalogs/ko/employee";

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function toId(value: bigint) {
  return value.toString();
}

const pendingRequestSelect = {
  id: true,
  scope: true,
  action: true,
  status: true,
  targetEmployeeId: true,
  requestedPayload: true,
  currentSnapshot: true,
  resolutionComment: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type DashboardEmployeeRow = {
  id: string;
  employeeCode: string | null;
  name: string;
  residentNumber: string | null;
  department: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  resignDate: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  incomeType: EmployeeIncomeType;
  incomeTypeLabel: string;
  canViewDetail: boolean;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  pendingRequest: ReturnType<typeof serializePendingRequestSummary> | null;
};

function isEmployeeIncomeType(value: string): value is EmployeeIncomeType {
  return value in EMPLOYEE_INCOME_TYPE_LABELS;
}

function isEmployeeStatusFilter(value: string): value is EmployeeStatusFilter {
  return ["ALL", "ACTIVE", "UPCOMING", "LEAVING", "INACTIVE"].includes(value);
}

function matchesStatusFilter(
  row: Pick<DashboardEmployeeRow, "hireDate" | "resignDate">,
  statusFilter: EmployeeStatusFilter,
) {
  if (statusFilter === "ALL") return true;

  const status = getEmployeeStatus(row.hireDate, row.resignDate);
  if (statusFilter === "ACTIVE") return status === "재직중";
  if (statusFilter === "UPCOMING") return status === "입사예정";
  if (statusFilter === "LEAVING") return status === "퇴사예정";
  return status === "퇴사완료";
}

function matchesSearch(
  row: Pick<
    DashboardEmployeeRow,
    | "name"
    | "employeeCode"
    | "department"
    | "positionTitle"
    | "email"
    | "phone"
    | "incomeTypeLabel"
  >,
  rawSearch: string,
) {
  if (!rawSearch) return true;

  const search = rawSearch.trim().toLowerCase();
  if (!search) return true;

  return [
    row.name,
    row.employeeCode,
    row.department,
    row.positionTitle,
    row.email,
    row.phone,
    row.incomeTypeLabel,
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(search));
}

function buildSummary(
  rows: DashboardEmployeeRow[],
  pendingRequests: Array<{
    action: string;
    requestedPayload: unknown;
  }>,
): CompanyEmployeeDashboardSummary {
  const pendingRequestCountByType = new Map<EmployeeIncomeType, number>(
    EMPLOYEE_INCOME_TYPE_OPTIONS.map((option) => [option.value, 0]),
  );

  for (const request of pendingRequests) {
    const payload = request.requestedPayload as { incomeType?: string } | null;
    const requestIncomeType = payload?.incomeType;
    const incomeType: EmployeeIncomeType =
      typeof requestIncomeType === "string" &&
      isEmployeeIncomeType(requestIncomeType)
        ? requestIncomeType
        : "EARNED_INCOME";

    pendingRequestCountByType.set(
      incomeType,
      (pendingRequestCountByType.get(incomeType) ?? 0) + 1,
    );
  }

  const summary: CompanyEmployeeDashboardSummary = {
    total: rows.length,
    active: 0,
    upcoming: 0,
    leaving: 0,
    inactive: 0,
    withContact: 0,
    withEmail: 0,
    pendingRequests: pendingRequests.length,
    byIncomeType: EMPLOYEE_INCOME_TYPE_OPTIONS.map((option) => ({
      incomeType: option.value,
      label: option.label,
      total: 0,
      active: 0,
      upcoming: 0,
      leaving: 0,
      inactive: 0,
      withContact: 0,
      withEmail: 0,
      pendingRequests: pendingRequestCountByType.get(option.value) ?? 0,
    })),
  };

  const summaryByType = new Map(
    summary.byIncomeType.map((item) => [item.incomeType, item]),
  );

  for (const row of rows) {
    const status = getEmployeeStatus(row.hireDate, row.resignDate);
    const bucket = summaryByType.get(row.incomeType);
    if (!bucket) continue;

    bucket.total += 1;

    if (row.phone) {
      summary.withContact += 1;
      bucket.withContact += 1;
    }

    if (row.email) {
      summary.withEmail += 1;
      bucket.withEmail += 1;
    }

    if (status === "재직중") {
      summary.active += 1;
      bucket.active += 1;
      continue;
    }

    if (status === "입사예정") {
      summary.upcoming += 1;
      bucket.upcoming += 1;
      continue;
    }

    if (status === "퇴사예정") {
      summary.leaving += 1;
      bucket.leaving += 1;
      continue;
    }

    if (status === "퇴사완료") {
      summary.inactive += 1;
      bucket.inactive += 1;
    }
  }

  return summary;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit")) || 50),
    );
    const search = url.searchParams.get("search")?.trim() || "";
    const incomeTypeParam = url.searchParams.get("incomeType")?.trim() || "ALL";
    const statusParam = url.searchParams.get("status")?.trim() || "ALL";

    if (incomeTypeParam !== "ALL" && !isEmployeeIncomeType(incomeTypeParam)) {
      return NextResponse.json(
        { error: "유효하지 않은 소득자 유형입니다." },
        { status: 400 },
      );
    }

    if (!isEmployeeStatusFilter(statusParam)) {
      return NextResponse.json(
        { error: "유효하지 않은 재직 상태 필터입니다." },
        { status: 400 },
      );
    }

    const incomeTypeFilter = incomeTypeParam as EmployeeIncomeFilter;
    const statusFilter = statusParam as EmployeeStatusFilter;

    const baseWhere = {
      companyId: auth.currentCompanyId,
      deletedAt: null,
      publishStatus: "PUBLISHED" as const,
    };

    const [
      employees,
      businessIncomeEmployees,
      otherIncomeEmployees,
      laborEmployees,
      pendingRequests,
    ] = await Promise.all([
      prisma.employee.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        include: {
          bankAccounts: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      }),
      prisma.businessIncomeEmployee.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          residentNumber: true,
          department: true,
          positionTitle: true,
          hireDate: true,
          resignDate: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.otherIncomeEmployee.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          residentNumber: true,
          department: true,
          positionTitle: true,
          hireDate: true,
          resignDate: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.otherIncomeLaborEmployee.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          residentNumber: true,
          department: true,
          positionTitle: true,
          hireDate: true,
          resignDate: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.companyChangeRequest.findMany({
        where: {
          companyId: auth.currentCompanyId,
          scope: "EMPLOYEE",
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: pendingRequestSelect,
      }),
    ]);

    const pendingRequestByEmployeeId = new Map<
      string,
      ReturnType<typeof serializePendingRequestSummary>
    >();

    for (const request of pendingRequests) {
      if (
        request.action === "CREATE" ||
        !request.targetEmployeeId ||
        pendingRequestByEmployeeId.has(request.targetEmployeeId.toString())
      ) {
        continue;
      }

      pendingRequestByEmployeeId.set(
        request.targetEmployeeId.toString(),
        serializePendingRequestSummary(request),
      );
    }

    const pendingCreateRequests = pendingRequests
      .filter((request) => request.action === "CREATE")
      .map((request) => serializePendingRequestSummary(request));

    const mergedRows: DashboardEmployeeRow[] = [
      ...employees.map<DashboardEmployeeRow>((emp) => {
        const ba = emp.bankAccounts[0] ?? null;

        return {
          id: toId(emp.id),
          employeeCode: emp.employeeCode,
          name: emp.name,
          residentNumber: emp.residentNumber,
          department: emp.department,
          positionTitle: emp.positionTitle,
          hireDate: emp.hireDate,
          resignDate: emp.resignDate,
          phone: emp.phone,
          email: emp.email,
          createdAt: emp.createdAt.toISOString(),
          incomeType: "EARNED_INCOME",
          incomeTypeLabel: EMPLOYEE_INCOME_TYPE_LABELS.EARNED_INCOME,
          canViewDetail: true,
          bankAccount: ba
            ? {
                bankName: ba.bankName,
                accountNumber: ba.accountNumber,
                accountHolder: ba.accountHolder,
              }
            : null,
          pendingRequest:
            pendingRequestByEmployeeId.get(emp.id.toString()) ?? null,
        };
      }),
      ...businessIncomeEmployees.map<DashboardEmployeeRow>((emp) => ({
        id: toId(emp.id),
        employeeCode: emp.employeeCode,
        name: emp.name,
        residentNumber: emp.residentNumber,
        department: emp.department,
        positionTitle: emp.positionTitle,
        hireDate: emp.hireDate,
        resignDate: emp.resignDate,
        phone: emp.phone,
        email: emp.email,
        createdAt: emp.createdAt.toISOString(),
        incomeType: "BUSINESS_INCOME" as const,
        incomeTypeLabel: EMPLOYEE_INCOME_TYPE_LABELS.BUSINESS_INCOME,
        canViewDetail: true,
        bankAccount: null,
        pendingRequest: null,
      })),
      ...otherIncomeEmployees.map<DashboardEmployeeRow>((emp) => ({
        id: toId(emp.id),
        employeeCode: emp.employeeCode,
        name: emp.name,
        residentNumber: emp.residentNumber,
        department: emp.department,
        positionTitle: emp.positionTitle,
        hireDate: emp.hireDate,
        resignDate: emp.resignDate,
        phone: emp.phone,
        email: emp.email,
        createdAt: emp.createdAt.toISOString(),
        incomeType: "OTHER_INCOME" as const,
        incomeTypeLabel: EMPLOYEE_INCOME_TYPE_LABELS.OTHER_INCOME,
        canViewDetail: true,
        bankAccount: null,
        pendingRequest: null,
      })),
      ...laborEmployees.map<DashboardEmployeeRow>((emp) => ({
        id: toId(emp.id),
        employeeCode: emp.employeeCode,
        name: emp.name,
        residentNumber: emp.residentNumber,
        department: emp.department,
        positionTitle: emp.positionTitle,
        hireDate: emp.hireDate,
        resignDate: emp.resignDate,
        phone: emp.phone,
        email: emp.email,
        createdAt: emp.createdAt.toISOString(),
        incomeType: "OTHER_INCOME_LABOR" as const,
        incomeTypeLabel: EMPLOYEE_INCOME_TYPE_LABELS.OTHER_INCOME_LABOR,
        canViewDetail: true,
        bankAccount: null,
        pendingRequest: null,
      })),
    ].sort((left, right) => {
      if (left.createdAt !== right.createdAt) {
        return right.createdAt.localeCompare(left.createdAt);
      }
      return left.name.localeCompare(right.name, "ko");
    });

    const summary = buildSummary(mergedRows, pendingRequests);

    const filteredRows = mergedRows.filter((row) => {
      if (incomeTypeFilter !== "ALL" && row.incomeType !== incomeTypeFilter) {
        return false;
      }

      if (!matchesStatusFilter(row, statusFilter)) {
        return false;
      }

      return matchesSearch(row, search);
    });

    const total = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const employeesPage = filteredRows.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      employees: employeesPage,
      pendingCreateRequests,
      summary,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Employee list GET error:", error);
    return NextResponse.json(
      { error: "직원 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: "직원 등록은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const rawBody = (await request.json()) as {
      incomeType?: EmployeeIncomeType;
    } & Record<string, unknown>;
    const incomeType: EmployeeIncomeType =
      rawBody.incomeType ?? "EARNED_INCOME";

    let sanitizedPayload: Record<string, unknown>;
    switch (incomeType) {
      case "BUSINESS_INCOME":
        sanitizedPayload = sanitizeBusinessIncomeEmployeePayload(
          rawBody as unknown as BusinessIncomeEmployeeCreateBody,
        );
        break;
      case "OTHER_INCOME":
        sanitizedPayload = sanitizeOtherIncomeEmployeePayload(
          rawBody as unknown as OtherIncomeEmployeeCreateBody,
        );
        break;
      case "OTHER_INCOME_LABOR":
        sanitizedPayload = sanitizeOtherIncomeLaborEmployeePayload(
          rawBody as unknown as OtherIncomeLaborEmployeeCreateBody,
        );
        break;
      default:
        sanitizedPayload = sanitizeEmployeeRequestPayload(
          rawBody as unknown as EmployeeCreateBody,
        );
        break;
    }

    const name = (sanitizedPayload.name as string)?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const createdRequest = await prisma.companyChangeRequest.create({
      data: {
        scope: "EMPLOYEE",
        action: "CREATE",
        companyId: auth.currentCompanyId,
        requestedByCompanyUserId: auth.userId,
        requestedPayload: { ...sanitizedPayload, incomeType },
      },
      select: pendingRequestSelect,
    });

    return NextResponse.json({
      success: true,
      request: serializePendingRequestSummary(createdRequest),
      message: "직원 등록 요청이 제출되었습니다.",
    });
  } catch (error) {
    console.error("Employee POST error:", error);
    return NextResponse.json(
      { error: "직원 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
