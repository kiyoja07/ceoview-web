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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    let employeeId: bigint;
    try {
      employeeId = BigInt(id);
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const [employee, pendingRequest] = await Promise.all([
      prisma.employee.findFirst({
        where: {
          id: employeeId,
          companyId: auth.currentCompanyId,
          deletedAt: null,
          publishStatus: "PUBLISHED",
        },
        include: {
          bankAccounts: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.companyChangeRequest.findFirst({
        where: {
          companyId: auth.currentCompanyId,
          scope: "EMPLOYEE",
          targetEmployeeId: employeeId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: pendingRequestSelect,
      }),
    ]);

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: toId(employee.id),
      employeeCode: employee.employeeCode,
      name: employee.name,
      residentNumber: employee.residentNumber,
      nationalityType: employee.nationalityType,
      jobCategory: employee.jobCategory,
      residenceType: employee.residenceType,
      department: employee.department,
      positionTitle: employee.positionTitle,
      email: employee.email,
      phone: employee.phone,
      landlinePhone: employee.landlinePhone,
      hireDate: employee.hireDate,
      resignDate: employee.resignDate,
      status: getEmployeeStatus(employee.hireDate, employee.resignDate),
      zipcode: employee.zipcode,
      address: employee.address,
      addressDetail: employee.addressDetail,
      hasSpouse: employee.hasSpouse,
      dependentUnder20: employee.dependentUnder20,
      dependentOver60: employee.dependentOver60,
      deductionSenior: employee.deductionSenior,
      deductionDisabled: employee.deductionDisabled,
      deductionWomen: employee.deductionWomen,
      deductionChildren: employee.deductionChildren,
      deductionBirthAdoption: employee.deductionBirthAdoption,
      deductionSingleParent: employee.deductionSingleParent,
      employmentInsurance: employee.employmentInsurance,
      payGrade: employee.payGrade,
      nationalPension: employee.nationalPension,
      healthInsurance: employee.healthInsurance,
      bankAccounts: employee.bankAccounts.map((ba) => ({
        id: toId(ba.id),
        bankName: ba.bankName,
        accountNumber: ba.accountNumber,
        accountHolder: ba.accountHolder,
      })),
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
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
    let employeeId: bigint;
    try {
      employeeId = BigInt(id);
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const body = sanitizeEmployeeRequestPayload(
      (await request.json()) as EmployeeUpdateBody,
    );

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: auth.currentCompanyId,
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      include: {
        bankAccounts: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!existing) {
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

    const createdRequest = await prisma.companyChangeRequest.create({
      data: {
        scope: "EMPLOYEE",
        action: "UPDATE",
        companyId: auth.currentCompanyId,
        requestedByCompanyUserId: auth.userId,
        targetEmployeeId: employeeId,
        requestedPayload: body,
        currentSnapshot: snapshotEmployeeRecord(existing),
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
    let employeeId: bigint;
    try {
      employeeId = BigInt(id);
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: auth.currentCompanyId,
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      include: {
        bankAccounts: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!existing) {
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

    const createdRequest = await prisma.companyChangeRequest.create({
      data: {
        scope: "EMPLOYEE",
        action: "DELETE",
        companyId: auth.currentCompanyId,
        requestedByCompanyUserId: auth.userId,
        targetEmployeeId: employeeId,
        requestedPayload: {
          employeeId: employeeId.toString(),
          name: existing.name,
        },
        currentSnapshot: snapshotEmployeeRecord(existing),
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
