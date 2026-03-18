import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import type { EmployeeUpdateBody } from "@/types/company/employees";
import { getEmployeeStatus } from "@/types/company/employees";

async function requireCompanyMember(request: NextRequest) {
  const userId = getCompanyUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.companyUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      isMaster: true,
      companyId: true,
    },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    isMaster: user.isMaster,
  } as const;
}

function toId(value: bigint) {
  return value.toString();
}

function parseBigIntId(value: string | undefined) {
  if (!value) return null;

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

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

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: auth.companyId,
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

    const body = (await request.json()) as EmployeeUpdateBody;

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const employee = await prisma.$transaction(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: {
          id: employeeId,
          companyId: auth.companyId,
          deletedAt: null,
          publishStatus: "PUBLISHED",
        },
        select: {
          id: true,
          bankAccounts: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      });

      if (!existing) {
        return null;
      }

      const existingBankAccountIds = new Set(
        existing.bankAccounts.map((bankAccount) => bankAccount.id.toString()),
      );

      const sanitizedBankAccounts =
        body.bankAccounts
          ?.filter((ba) => ba.bankName?.trim() && ba.accountNumber?.trim())
          .map((ba) => ({
            id: parseBigIntId(ba.id),
            bankName: ba.bankName.trim(),
            accountNumber: ba.accountNumber.trim(),
            accountHolder: ba.accountHolder?.trim() || name,
          })) ?? [];

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

      for (const bankAccount of sanitizedBankAccounts) {
        const existingBankAccountId = bankAccount.id?.toString();
        if (
          existingBankAccountId &&
          existingBankAccountIds.has(existingBankAccountId)
        ) {
          retainedBankAccountIds.add(existingBankAccountId);
          await tx.employeeBankAccount.update({
            where: { id: bankAccount.id! },
            data: {
              bankName: bankAccount.bankName,
              accountNumber: bankAccount.accountNumber,
              accountHolder: bankAccount.accountHolder,
              deletedAt: null,
            },
          });
          continue;
        }

        await tx.employeeBankAccount.create({
          data: {
            employeeId,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountHolder: bankAccount.accountHolder,
          },
        });
      }

      const bankAccountIdsToSoftDelete = existing.bankAccounts
        .filter(
          (bankAccount) =>
            !retainedBankAccountIds.has(bankAccount.id.toString()),
        )
        .map((bankAccount) => bankAccount.id);

      if (bankAccountIdsToSoftDelete.length > 0) {
        await tx.employeeBankAccount.updateMany({
          where: {
            id: { in: bankAccountIdsToSoftDelete },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
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
    console.error("Employee PATCH error:", error);
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
        companyId: auth.companyId,
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.employeeBankAccount.updateMany({
        where: {
          employeeId,
          deletedAt: null,
        },
        data: {
          deletedAt,
        },
      }),
      prisma.employee.update({
        where: { id: employeeId },
        data: {
          deletedAt,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json(
      { error: "직원 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
