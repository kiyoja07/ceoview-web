import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  EMPLOYEE_CODE_TAKEN_MESSAGE,
  isEmployeeCodeTaken,
} from "@/app/lib/employee-code";
import { sanitizeEmployeePayload } from "@/app/lib/company-input";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import type { EmployeeCreateBody } from "@/types/company/employees";
import { getEmployeeStatus } from "@/types/company/employees";

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

function toId(value: string) {
  return value.toString();
}

function parseObjectId(value: string | undefined) {
  return value || null;
}

type RouteContext = {
  params: Promise<{ id: string; employeeId: string }>;
};

// GET: 직원 상세 조회
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id, employeeId: employeeIdRaw } = await context.params;

    let companyId: string;
    try {
      companyId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
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

    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId,
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
        deletedAt: null,
      },
      include: {
        bankAccounts: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

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
    });
  } catch (error) {
    console.error("Agent employee GET error:", error);
    return NextResponse.json(
      { error: "직원 정보 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// PATCH: 직원 정보 수정
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id, employeeId: employeeIdRaw } = await context.params;

    let companyId: string;
    try {
      companyId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
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

    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId,
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

    const rawBody = (await request.json()) as Record<string, unknown>;
    const body = sanitizeEmployeePayload(rawBody as EmployeeCreateBody);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    if (
      await isEmployeeCodeTaken({
        incomeType: "EARNED_INCOME",
        companyId,
        employeeCode: body.employeeCode,
        excludeId: employeeId,
      })
    ) {
      return NextResponse.json(
        { error: EMPLOYEE_CODE_TAKEN_MESSAGE },
        { status: 409 },
      );
    }

    const employee = await prisma.$transaction(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id: employeeId, companyId, deletedAt: null },
        select: {
          id: true,
          bankAccounts: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      });

      if (!existing) return null;

      const existingBankAccountIds = new Set(
        existing.bankAccounts.map((ba) => ba.id.toString()),
      );

      const sanitizedBankAccounts = Array.isArray(body.bankAccounts)
        ? (
            body.bankAccounts as {
              id?: string;
              bankName?: string;
              accountNumber?: string;
              accountHolder?: string;
            }[]
          )
            .filter((ba) => ba.bankName?.trim() && ba.accountNumber?.trim())
            .map((ba) => ({
              id: parseObjectId(ba.id),
              bankName: ba.bankName!.trim(),
              accountNumber: ba.accountNumber!.trim(),
              accountHolder: ba.accountHolder?.trim() || name,
            }))
        : [];

      const retainedBankAccountIds = new Set<string>();

      await tx.employee.update({
        where: { id: employeeId },
        data: {
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
        },
      });

      for (const ba of sanitizedBankAccounts) {
        const existingId = ba.id?.toString();
        if (existingId && existingBankAccountIds.has(existingId)) {
          retainedBankAccountIds.add(existingId);
          await tx.employeeBankAccount.update({
            where: { id: ba.id! },
            data: {
              bankName: ba.bankName,
              accountNumber: ba.accountNumber,
              accountHolder: ba.accountHolder,
              deletedAt: null,
            },
          });
          continue;
        }
        await tx.employeeBankAccount.create({
          data: {
            employeeId,
            bankName: ba.bankName,
            accountNumber: ba.accountNumber,
            accountHolder: ba.accountHolder,
          },
        });
      }

      const idsToSoftDelete = existing.bankAccounts
        .filter((ba) => !retainedBankAccountIds.has(ba.id.toString()))
        .map((ba) => ba.id);

      if (idsToSoftDelete.length > 0) {
        await tx.employeeBankAccount.updateMany({
          where: { id: { in: idsToSoftDelete }, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }

      return tx.employee.findUnique({
        where: { id: employeeId },
        include: {
          bankAccounts: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

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
    });
  } catch (error) {
    console.error("Agent employee PATCH error:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "이미 사용 중인 사원코드입니다." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "직원 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
