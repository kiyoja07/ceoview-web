import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  sanitizeEmployeePayload,
  sanitizeBusinessIncomeEmployeePayload,
  sanitizeOtherIncomeEmployeePayload,
  sanitizeOtherIncomeLaborEmployeePayload,
} from "@/app/lib/company-input";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import { resolveUploadForCompanyView } from "@/app/lib/salary-upload-view";
import type {
  CompanyEmployeeDashboardSummary,
  EmployeeCreateBody,
  EmployeeIncomeFilter,
  BusinessIncomeEmployeeCreateBody,
  EmployeeBankAccountBody,
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

const RECENT_PAID_MONTHS = 6;

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function toId(value: string) {
  return value.toString();
}

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

type RecentPaidCounts = {
  total: number;
  byIncomeType: Record<EmployeeIncomeType, number>;
};

type RecentPaidMonthBucket = {
  earnedCount: number;
  businessCount: number;
  otherCount: number;
  dailyCount: number;
};

function createEmptyRecentPaidBucket(): RecentPaidMonthBucket {
  return {
    earnedCount: 0,
    businessCount: 0,
    otherCount: 0,
    dailyCount: 0,
  };
}

function getRecentYms(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - count + index + 1,
      1,
    );
    return date.getFullYear() * 100 + (date.getMonth() + 1);
  });
}

async function getRecentPaidCounts(
  request: NextRequest,
  companyId: string,
): Promise<RecentPaidCounts> {
  const recentYms = getRecentYms(RECENT_PAID_MONTHS);
  const startYm = recentYms[0];
  const endYm = recentYms[recentYms.length - 1];

  const [earnedView, businessView, otherView, dailyView] = await Promise.all([
    resolveUploadForCompanyView(request, companyId, "EARNED_INCOME"),
    resolveUploadForCompanyView(request, companyId, "BUSINESS_INCOME"),
    resolveUploadForCompanyView(request, companyId, "OTHER_INCOME"),
    resolveUploadForCompanyView(request, companyId, "OTHER_INCOME_LABOR"),
  ]);

  const [earnedStats, businessStats, otherStats, dailyStats] =
    await Promise.all([
      earnedView.uploadId
        ? prisma.earnedIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: earnedView.uploadId,
              paymentYm: { gte: startYm, lte: endYm },
            },
            _count: true,
          })
        : Promise.resolve([]),
      businessView.uploadId
        ? prisma.businessIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: businessView.uploadId,
              paymentYm: { gte: startYm, lte: endYm },
            },
            _count: true,
          })
        : Promise.resolve([]),
      otherView.uploadId
        ? prisma.otherIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: otherView.uploadId,
              paymentYm: { gte: startYm, lte: endYm },
            },
            _count: true,
          })
        : Promise.resolve([]),
      dailyView.uploadId && dailyView.uploadedAt
        ? prisma.dailyIncomeLabor.groupBy({
            by: ["uploadId"],
            where: { uploadId: dailyView.uploadId },
            _count: true,
          })
        : Promise.resolve([]),
    ]);

  const monthlyMap = new Map<number, RecentPaidMonthBucket>();
  for (const ym of recentYms) {
    monthlyMap.set(ym, createEmptyRecentPaidBucket());
  }

  for (const row of earnedStats) {
    const entry = monthlyMap.get(row.paymentYm) ?? createEmptyRecentPaidBucket();
    entry.earnedCount += row._count;
    monthlyMap.set(row.paymentYm, entry);
  }

  for (const row of businessStats) {
    const entry = monthlyMap.get(row.paymentYm) ?? createEmptyRecentPaidBucket();
    entry.businessCount += row._count;
    monthlyMap.set(row.paymentYm, entry);
  }

  for (const row of otherStats) {
    const entry = monthlyMap.get(row.paymentYm) ?? createEmptyRecentPaidBucket();
    entry.otherCount += row._count;
    monthlyMap.set(row.paymentYm, entry);
  }

  if (dailyView.uploadedAt) {
    const ym =
      dailyView.uploadedAt.getFullYear() * 100 +
      (dailyView.uploadedAt.getMonth() + 1);

    if (ym >= startYm && ym <= endYm) {
      const entry = monthlyMap.get(ym) ?? createEmptyRecentPaidBucket();
      for (const row of dailyStats) {
        entry.dailyCount += row._count;
      }
      monthlyMap.set(ym, entry);
    }
  }

  const latestYm =
    [...recentYms].reverse().find((ym) => {
      const bucket = monthlyMap.get(ym) ?? createEmptyRecentPaidBucket();
      return (
        bucket.earnedCount +
          bucket.businessCount +
          bucket.otherCount +
          bucket.dailyCount >
        0
      );
    }) ?? null;

  const latestBucket =
    latestYm != null
      ? (monthlyMap.get(latestYm) ?? createEmptyRecentPaidBucket())
      : createEmptyRecentPaidBucket();

  return {
    total:
      latestBucket.earnedCount +
      latestBucket.businessCount +
      latestBucket.otherCount +
      latestBucket.dailyCount,
    byIncomeType: {
      EARNED_INCOME: latestBucket.earnedCount,
      BUSINESS_INCOME: latestBucket.businessCount,
      OTHER_INCOME: latestBucket.otherCount,
      OTHER_INCOME_LABOR: latestBucket.dailyCount,
    },
  };
}

function buildSummary(
  rows: DashboardEmployeeRow[],
  recentPaidCounts: RecentPaidCounts,
): CompanyEmployeeDashboardSummary {
  const summary: CompanyEmployeeDashboardSummary = {
    total: rows.length,
    recentPaidTotal: recentPaidCounts.total,
    active: 0,
    upcoming: 0,
    leaving: 0,
    inactive: 0,
    withContact: 0,
    withEmail: 0,
    byIncomeType: EMPLOYEE_INCOME_TYPE_OPTIONS.map((option) => ({
      incomeType: option.value,
      label: option.label,
      total: 0,
      recentPaidCount: recentPaidCounts.byIncomeType[option.value] ?? 0,
      active: 0,
      upcoming: 0,
      leaving: 0,
      inactive: 0,
      withContact: 0,
      withEmail: 0,
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

function getPrimaryBankAccount(body: {
  bankAccounts?: EmployeeBankAccountBody[] | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
}) {
  const bankAccount = body.bankAccounts?.find(
    (item) => item.bankName || item.accountNumber || item.accountHolder,
  );

  if (bankAccount) return bankAccount;

  if (body.bankName || body.accountNumber || body.accountHolder) {
    return {
      bankName: body.bankName ?? "",
      accountNumber: body.accountNumber ?? "",
      accountHolder: body.accountHolder ?? "",
    };
  }

  return null;
}

async function createEmployeeByIncomeType(
  companyId: string,
  incomeType: EmployeeIncomeType,
  payload: Record<string, unknown>,
  name: string,
) {
  if (incomeType === "BUSINESS_INCOME") {
    const body = payload as BusinessIncomeEmployeeCreateBody;
    const primaryBankAccount = getPrimaryBankAccount(body);
    return prisma.businessIncomeEmployee.create({
      data: {
        companyId,
        employeeCode: body.employeeCode?.trim() || null,
        name,
        residentNumber: body.residentNumber?.trim() || null,
        nationalityType: body.nationalityType?.trim() || null,
        incomeCategory: body.incomeCategory?.trim() || null,
        residenceType: body.residenceType?.trim() || null,
        businessName: body.businessName?.trim() || null,
        businessRegistrationNumber:
          body.businessRegistrationNumber?.trim() || null,
        businessAddress: body.businessAddress?.trim() || null,
        address: body.address?.trim() || null,
        addressDetail: body.addressDetail?.trim() || null,
        zipcode: body.zipcode?.trim() || null,
        department: body.department?.trim() || null,
        positionTitle: body.positionTitle?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        hireDate: body.hireDate?.trim() || null,
        resignDate: body.resignDate?.trim() || null,
        bankName: primaryBankAccount?.bankName?.trim() || null,
        accountNumber: primaryBankAccount?.accountNumber?.trim() || null,
        accountHolder: primaryBankAccount?.accountHolder?.trim() || null,
        publishStatus: "PUBLISHED",
      },
    });
  }

  if (incomeType === "OTHER_INCOME") {
    const body = payload as OtherIncomeEmployeeCreateBody;
    const primaryBankAccount = getPrimaryBankAccount(body);
    return prisma.otherIncomeEmployee.create({
      data: {
        companyId,
        employeeCode: body.employeeCode?.trim() || null,
        name,
        residentNumber: body.residentNumber?.trim() || null,
        nationalityType: body.nationalityType?.trim() || null,
        incomeCategory: body.incomeCategory?.trim() || null,
        residenceType: body.residenceType?.trim() || null,
        personType: body.personType?.trim() || null,
        businessRegistrationNumber:
          body.businessRegistrationNumber?.trim() || null,
        businessAddress: body.businessAddress?.trim() || null,
        zipcode: body.zipcode?.trim() || null,
        address: body.address?.trim() || null,
        addressDetail: body.addressDetail?.trim() || null,
        department: body.department?.trim() || null,
        positionTitle: body.positionTitle?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        hireDate: body.hireDate?.trim() || null,
        resignDate: body.resignDate?.trim() || null,
        bankName: primaryBankAccount?.bankName?.trim() || null,
        accountNumber: primaryBankAccount?.accountNumber?.trim() || null,
        accountHolder: primaryBankAccount?.accountHolder?.trim() || null,
        publishStatus: "PUBLISHED",
      },
    });
  }

  if (incomeType === "OTHER_INCOME_LABOR") {
    const body = payload as OtherIncomeLaborEmployeeCreateBody;
    const primaryBankAccount = getPrimaryBankAccount(body);
    return prisma.otherIncomeLaborEmployee.create({
      data: {
        companyId,
        employeeCode: body.employeeCode?.trim() || null,
        name,
        residentNumber: body.residentNumber?.trim() || null,
        nationalityType: body.nationalityType?.trim() || null,
        residenceType: body.residenceType?.trim() || null,
        zipcode: body.zipcode?.trim() || null,
        department: body.department?.trim() || null,
        positionTitle: body.positionTitle?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        hireDate: body.hireDate?.trim() || null,
        resignDate: body.resignDate?.trim() || null,
        address: body.address?.trim() || null,
        addressDetail: body.addressDetail?.trim() || null,
        bankName: primaryBankAccount?.bankName?.trim() || null,
        accountNumber: primaryBankAccount?.accountNumber?.trim() || null,
        accountHolder: primaryBankAccount?.accountHolder?.trim() || null,
        publishStatus: "PUBLISHED",
      },
    });
  }

  const body = payload as EmployeeCreateBody;
  return prisma.employee.create({
    data: {
      companyId,
      employeeCode: body.employeeCode?.trim() || null,
      name,
      residentNumber: body.residentNumber?.trim() || null,
      nationalityType: body.nationalityType?.trim() || null,
      jobCategory: body.jobCategory?.trim() || null,
      residenceType: body.residenceType?.trim() || null,
      department: body.department?.trim() || null,
      positionTitle: body.positionTitle?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      landlinePhone: body.landlinePhone?.trim() || null,
      hireDate: body.hireDate?.trim() || null,
      resignDate: body.resignDate?.trim() || null,
      zipcode: body.zipcode?.trim() || null,
      address: body.address?.trim() || null,
      addressDetail: body.addressDetail?.trim() || null,
      hasSpouse: body.hasSpouse?.trim() || null,
      dependentUnder20: body.dependentUnder20?.trim() || null,
      dependentOver60: body.dependentOver60?.trim() || null,
      deductionSenior: body.deductionSenior?.trim() || null,
      deductionDisabled: body.deductionDisabled?.trim() || null,
      deductionWomen: body.deductionWomen?.trim() || null,
      deductionChildren: body.deductionChildren?.trim() || null,
      deductionBirthAdoption: body.deductionBirthAdoption?.trim() || null,
      deductionSingleParent: body.deductionSingleParent?.trim() || null,
      employmentInsurance: body.employmentInsurance?.trim() || null,
      payGrade: body.payGrade?.trim() || null,
      nationalPension: body.nationalPension?.trim() || null,
      healthInsurance: body.healthInsurance?.trim() || null,
      publishStatus: "PUBLISHED",
      bankAccounts: {
        create:
          body.bankAccounts
            ?.filter((ba) => ba.bankName?.trim() && ba.accountNumber?.trim())
            .map((ba) => ({
              bankName: ba.bankName.trim(),
              accountNumber: ba.accountNumber.trim(),
              accountHolder: ba.accountHolder?.trim() || name,
            })) ?? [],
      },
    },
  });
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
      recentPaidCounts,
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
      getRecentPaidCounts(request, auth.currentCompanyId),
    ]);

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
      })),
    ].sort((left, right) => {
      if (left.createdAt !== right.createdAt) {
        return right.createdAt.localeCompare(left.createdAt);
      }
      return left.name.localeCompare(right.name, "ko");
    });

    const summary = buildSummary(mergedRows, recentPaidCounts);

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

    if (!isEmployeeIncomeType(incomeType)) {
      return NextResponse.json(
        { error: "유효하지 않은 소득자 유형입니다." },
        { status: 400 },
      );
    }

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
        sanitizedPayload = sanitizeEmployeePayload(
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

    const created = await createEmployeeByIncomeType(
      auth.currentCompanyId,
      incomeType,
      sanitizedPayload,
      name,
    );

    return NextResponse.json({
      success: true,
      id: created.id.toString(),
      name: created.name,
      message: "직원이 등록되었습니다.",
    });
  } catch (error) {
    console.error("Employee POST error:", error);
    return NextResponse.json(
      { error: "직원 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
