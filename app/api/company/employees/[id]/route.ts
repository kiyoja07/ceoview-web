import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  sanitizeEmployeeRequestPayload,
  serializePendingRequestSummary,
  snapshotEmployeeRecord,
} from "@/app/lib/company-change-request";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import type { EmployeeUpdateBody } from "@/types/company/employees";
import { getEmployeeStatus } from "@/types/company/employees";
import type { EmployeeIncomeType } from "@/types/company/employees";

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

const VALID_INCOME_TYPES = new Set<EmployeeIncomeType>([
  "EARNED_INCOME",
  "BUSINESS_INCOME",
  "OTHER_INCOME",
  "OTHER_INCOME_LABOR",
]);

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseIncomeType(request: NextRequest): EmployeeIncomeType {
  const raw = request.nextUrl.searchParams.get("incomeType");
  if (raw && VALID_INCOME_TYPES.has(raw as EmployeeIncomeType)) {
    return raw as EmployeeIncomeType;
  }
  return "EARNED_INCOME";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snapshotNonEarnedIncomeRecord(record: Record<string, any>) {
  const {
    id: _id,
    companyId: _companyId,
    company: _company,
    publishStatus: _publishStatus,
    ...rest
  } = record;
  const snapshot: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value instanceof Date) {
      snapshot[key] = value.toISOString();
    } else if (typeof value === "string") {
      snapshot[key] = value.toString();
    } else {
      snapshot[key] = value ?? null;
    }
  }
  return snapshot;
}

async function findEmployeeByIncomeType(
  incomeType: EmployeeIncomeType,
  employeeId: string,
  companyId: string,
) {
  const baseWhere = {
    id: employeeId,
    companyId,
    deletedAt: null,
    publishStatus: "PUBLISHED" as const,
  };

  switch (incomeType) {
    case "EARNED_INCOME":
      return {
        type: "EARNED_INCOME" as const,
        record: await prisma.employee.findFirst({
          where: baseWhere,
          include: {
            bankAccounts: {
              where: { deletedAt: null },
              orderBy: { createdAt: "asc" },
            },
          },
        }),
      };
    case "BUSINESS_INCOME":
      return {
        type: "BUSINESS_INCOME" as const,
        record: await prisma.businessIncomeEmployee.findFirst({
          where: baseWhere,
        }),
      };
    case "OTHER_INCOME":
      return {
        type: "OTHER_INCOME" as const,
        record: await prisma.otherIncomeEmployee.findFirst({
          where: baseWhere,
        }),
      };
    case "OTHER_INCOME_LABOR":
      return {
        type: "OTHER_INCOME_LABOR" as const,
        record: await prisma.otherIncomeLaborEmployee.findFirst({
          where: baseWhere,
        }),
      };
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    let employeeId: string;
    try {
      employeeId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const incomeType = parseIncomeType(request);
    const result = await findEmployeeByIncomeType(
      incomeType,
      employeeId,
      auth.currentCompanyId,
    );

    if (!result.record) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const pendingRequest = await prisma.companyChangeRequest.findFirst({
      where: {
        companyId: auth.currentCompanyId,
        scope: "EMPLOYEE",
        targetEmployeeId: employeeId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: pendingRequestSelect,
    });

    const emp = result.record;

    if (result.type === "EARNED_INCOME") {
      const earned = emp as NonNullable<
        Awaited<ReturnType<typeof prisma.employee.findFirst>>
      > & {
        bankAccounts: Array<{
          id: string;
          bankName: string;
          accountNumber: string;
          accountHolder: string;
        }>;
      };
      return NextResponse.json({
        id: toId(earned.id),
        incomeType: "EARNED_INCOME",
        employeeCode: earned.employeeCode,
        name: earned.name,
        residentNumber: earned.residentNumber,
        nationalityType: earned.nationalityType,
        jobCategory: earned.jobCategory,
        residenceType: earned.residenceType,
        department: earned.department,
        positionTitle: earned.positionTitle,
        email: earned.email,
        phone: earned.phone,
        landlinePhone: earned.landlinePhone,
        hireDate: earned.hireDate,
        resignDate: earned.resignDate,
        status: getEmployeeStatus(earned.hireDate, earned.resignDate),
        zipcode: earned.zipcode,
        address: earned.address,
        addressDetail: earned.addressDetail,
        hasSpouse: earned.hasSpouse,
        dependentUnder20: earned.dependentUnder20,
        dependentOver60: earned.dependentOver60,
        deductionSenior: earned.deductionSenior,
        deductionDisabled: earned.deductionDisabled,
        deductionWomen: earned.deductionWomen,
        deductionChildren: earned.deductionChildren,
        deductionBirthAdoption: earned.deductionBirthAdoption,
        deductionSingleParent: earned.deductionSingleParent,
        employmentInsurance: earned.employmentInsurance,
        payGrade: earned.payGrade,
        nationalPension: earned.nationalPension,
        healthInsurance: earned.healthInsurance,
        bankAccounts: earned.bankAccounts.map((ba) => ({
          id: toId(ba.id),
          bankName: ba.bankName,
          accountNumber: ba.accountNumber,
          accountHolder: ba.accountHolder,
        })),
        createdAt: earned.createdAt.toISOString(),
        updatedAt: earned.updatedAt.toISOString(),
        pendingRequest: pendingRequest
          ? serializePendingRequestSummary(pendingRequest)
          : null,
      });
    }

    if (result.type === "BUSINESS_INCOME") {
      const biz = emp as NonNullable<
        Awaited<ReturnType<typeof prisma.businessIncomeEmployee.findFirst>>
      >;
      return NextResponse.json({
        id: toId(biz.id),
        incomeType: "BUSINESS_INCOME",
        employeeCode: biz.employeeCode,
        name: biz.name,
        residentNumber: biz.residentNumber,
        nationalityType: biz.nationalityType,
        residenceType: biz.residenceType,
        department: biz.department,
        positionTitle: biz.positionTitle,
        email: biz.email,
        phone: biz.phone,
        hireDate: biz.hireDate,
        resignDate: biz.resignDate,
        status: getEmployeeStatus(biz.hireDate, biz.resignDate),
        zipcode: biz.zipcode,
        address: biz.address,
        // 사업소득 고유 필드
        incomeCategory: biz.incomeCategory,
        businessName: biz.businessName,
        businessRegistrationNumber: biz.businessRegistrationNumber,
        businessAddress: biz.businessAddress,
        bankAccounts: [],
        createdAt: biz.createdAt.toISOString(),
        updatedAt: biz.updatedAt.toISOString(),
        pendingRequest: pendingRequest
          ? serializePendingRequestSummary(pendingRequest)
          : null,
      });
    }

    if (result.type === "OTHER_INCOME") {
      const other = emp as NonNullable<
        Awaited<ReturnType<typeof prisma.otherIncomeEmployee.findFirst>>
      >;
      return NextResponse.json({
        id: toId(other.id),
        incomeType: "OTHER_INCOME",
        employeeCode: other.employeeCode,
        name: other.name,
        residentNumber: other.residentNumber,
        nationalityType: other.nationalityType,
        residenceType: other.residenceType,
        department: other.department,
        positionTitle: other.positionTitle,
        email: other.email,
        phone: other.phone,
        hireDate: other.hireDate,
        resignDate: other.resignDate,
        status: getEmployeeStatus(other.hireDate, other.resignDate),
        zipcode: other.zipcode,
        // 기타소득 고유 필드
        incomeCategory: other.incomeCategory,
        personType: other.personType,
        businessRegistrationNumber: other.businessRegistrationNumber,
        businessAddress: other.businessAddress,
        bankAccounts: [],
        createdAt: other.createdAt.toISOString(),
        updatedAt: other.updatedAt.toISOString(),
        pendingRequest: pendingRequest
          ? serializePendingRequestSummary(pendingRequest)
          : null,
      });
    }

    // OTHER_INCOME_LABOR
    const labor = emp as NonNullable<
      Awaited<ReturnType<typeof prisma.otherIncomeLaborEmployee.findFirst>>
    >;
    return NextResponse.json({
      id: toId(labor.id),
      incomeType: "OTHER_INCOME_LABOR",
      employeeCode: labor.employeeCode,
      name: labor.name,
      residentNumber: labor.residentNumber,
      department: labor.department,
      positionTitle: labor.positionTitle,
      email: labor.email,
      phone: labor.phone,
      hireDate: labor.hireDate,
      resignDate: labor.resignDate,
      status: getEmployeeStatus(labor.hireDate, labor.resignDate),
      address: labor.address,
      // 일용소득 고유 필드
      laborJobCategory: labor.jobCategory,
      payType: labor.payType,
      paymentMethod: labor.paymentMethod,
      overtimeType: labor.overtimeType,
      normalPay: labor.normalPay?.toString() ?? null,
      overtimePay: labor.overtimePay?.toString() ?? null,
      siteName: labor.siteName,
      bankName: labor.bankName,
      accountNumber: labor.accountNumber,
      bankAccounts: labor.bankName
        ? [
            {
              id: toId(labor.id),
              bankName: labor.bankName,
              accountNumber: labor.accountNumber ?? "",
              accountHolder: labor.name,
            },
          ]
        : [],
      createdAt: labor.createdAt.toISOString(),
      updatedAt: labor.updatedAt.toISOString(),
      pendingRequest: pendingRequest
        ? serializePendingRequestSummary(pendingRequest)
        : null,
    });
  } catch (error) {
    console.error("Employee GET error:", error);
    return NextResponse.json(
      { error: "직원 정보 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: "직원 정보 수정은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    let employeeId: string;
    try {
      employeeId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const incomeType = parseIncomeType(request);
    const rawBody = await request.json();
    const name = (rawBody as { name?: string }).name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const result = await findEmployeeByIncomeType(
      incomeType,
      employeeId,
      auth.currentCompanyId,
    );

    if (!result.record) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const pendingRequest = await prisma.companyChangeRequest.findFirst({
      where: {
        companyId: auth.currentCompanyId,
        scope: "EMPLOYEE",
        targetEmployeeId: employeeId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: "이미 처리 대기 중인 직원 변경 요청이 있습니다." },
        { status: 409 },
      );
    }

    const body =
      incomeType === "EARNED_INCOME"
        ? sanitizeEmployeeRequestPayload(rawBody as EmployeeUpdateBody)
        : { ...rawBody, incomeType };

    const snapshot =
      incomeType === "EARNED_INCOME"
        ? snapshotEmployeeRecord(
            result.record as Parameters<typeof snapshotEmployeeRecord>[0],
          )
        : {
            ...snapshotNonEarnedIncomeRecord(
              result.record as Record<string, unknown>,
            ),
            incomeType,
          };

    const createdRequest = await prisma.companyChangeRequest.create({
      data: {
        scope: "EMPLOYEE",
        action: "UPDATE",
        companyId: auth.currentCompanyId,
        requestedByCompanyUserId: auth.userId,
        targetEmployeeId: employeeId,
        requestedPayload: body,
        currentSnapshot: snapshot,
      },
      select: pendingRequestSelect,
    });

    return NextResponse.json({
      success: true,
      request: serializePendingRequestSummary(createdRequest),
      message: "직원 수정 요청이 제출되었습니다.",
    });
  } catch (error) {
    console.error("Employee PATCH error:", error);
    return NextResponse.json(
      { error: "직원 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: "직원 삭제는 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    let employeeId: string;
    try {
      employeeId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const incomeType = parseIncomeType(request);
    const result = await findEmployeeByIncomeType(
      incomeType,
      employeeId,
      auth.currentCompanyId,
    );

    if (!result.record) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const existing = await prisma.companyChangeRequest.findFirst({
      where: {
        companyId: auth.currentCompanyId,
        scope: "EMPLOYEE",
        targetEmployeeId: employeeId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 처리 대기 중인 직원 변경 요청이 있습니다." },
        { status: 409 },
      );
    }

    const snapshot =
      incomeType === "EARNED_INCOME"
        ? snapshotEmployeeRecord(
            result.record as Parameters<typeof snapshotEmployeeRecord>[0],
          )
        : {
            ...snapshotNonEarnedIncomeRecord(
              result.record as Record<string, unknown>,
            ),
            incomeType,
          };

    const createdRequest = await prisma.companyChangeRequest.create({
      data: {
        scope: "EMPLOYEE",
        action: "DELETE",
        companyId: auth.currentCompanyId,
        requestedByCompanyUserId: auth.userId,
        targetEmployeeId: employeeId,
        requestedPayload: {
          employeeId: employeeId.toString(),
          name: result.record.name,
          incomeType,
        },
        currentSnapshot: snapshot,
      },
      select: pendingRequestSelect,
    });

    return NextResponse.json({
      success: true,
      request: serializePendingRequestSummary(createdRequest),
      message: "직원 삭제 요청이 제출되었습니다.",
    });
  } catch (error) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json(
      { error: "직원 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
