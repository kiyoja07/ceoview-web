import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  sanitizeEmployeePayload,
} from "@/app/lib/company-input";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import type {
  EmployeeBankAccountBody,
  EmployeeUpdateBody,
} from "@/types/company/employees";
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

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanFloat(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseObjectId(value: string | undefined) {
  return value || null;
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

    if (incomeType === "EARNED_INCOME") {
      const body = sanitizeEmployeePayload(rawBody as EmployeeUpdateBody);
      const existing = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          companyId: auth.currentCompanyId,
          deletedAt: null,
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
        return NextResponse.json(
          { error: "직원 정보를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      const existingBankAccountIds = new Set(
        existing.bankAccounts.map((ba) => ba.id.toString()),
      );
      const sanitizedBankAccounts = Array.isArray(body.bankAccounts)
        ? body.bankAccounts
            .filter((ba) => ba.bankName?.trim() && ba.accountNumber?.trim())
            .map((ba) => ({
              id: parseObjectId(ba.id),
              bankName: ba.bankName.trim(),
              accountNumber: ba.accountNumber.trim(),
              accountHolder: ba.accountHolder?.trim() || name,
            }))
        : [];
      const retainedBankAccountIds = new Set<string>();

      await prisma.$transaction(async (tx) => {
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
            deductionBirthAdoption:
              body.deductionBirthAdoption?.trim() || null,
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
      });
    } else if (incomeType === "BUSINESS_INCOME") {
      const primaryBankAccount = getPrimaryBankAccount(
        rawBody as Record<string, unknown>,
      );
      await prisma.businessIncomeEmployee.update({
        where: { id: employeeId },
        data: {
          employeeCode: cleanString(rawBody.employeeCode),
          name,
          residentNumber: cleanString(rawBody.residentNumber),
          nationalityType: cleanString(rawBody.nationalityType),
          incomeCategory: cleanString(rawBody.incomeCategory),
          residenceType: cleanString(rawBody.residenceType),
          businessName: cleanString(rawBody.businessName),
          businessRegistrationNumber: cleanString(
            rawBody.businessRegistrationNumber,
          ),
          businessAddress: cleanString(rawBody.businessAddress),
          address: cleanString(rawBody.address),
          addressDetail: cleanString(rawBody.addressDetail),
          zipcode: cleanString(rawBody.zipcode),
          department: cleanString(rawBody.department),
          positionTitle: cleanString(rawBody.positionTitle),
          email: cleanString(rawBody.email),
          phone: cleanString(rawBody.phone),
          hireDate: cleanString(rawBody.hireDate),
          resignDate: cleanString(rawBody.resignDate),
          bankName: primaryBankAccount?.bankName?.trim() || null,
          accountNumber: primaryBankAccount?.accountNumber?.trim() || null,
          accountHolder: primaryBankAccount?.accountHolder?.trim() || null,
        },
      });
    } else if (incomeType === "OTHER_INCOME") {
      const primaryBankAccount = getPrimaryBankAccount(
        rawBody as Record<string, unknown>,
      );
      await prisma.otherIncomeEmployee.update({
        where: { id: employeeId },
        data: {
          employeeCode: cleanString(rawBody.employeeCode),
          name,
          residentNumber: cleanString(rawBody.residentNumber),
          nationalityType: cleanString(rawBody.nationalityType),
          incomeCategory: cleanString(rawBody.incomeCategory),
          residenceType: cleanString(rawBody.residenceType),
          personType: cleanString(rawBody.personType),
          businessRegistrationNumber: cleanString(
            rawBody.businessRegistrationNumber,
          ),
          businessAddress: cleanString(rawBody.businessAddress),
          zipcode: cleanString(rawBody.zipcode),
          address: cleanString(rawBody.address),
          addressDetail: cleanString(rawBody.addressDetail),
          department: cleanString(rawBody.department),
          positionTitle: cleanString(rawBody.positionTitle),
          email: cleanString(rawBody.email),
          phone: cleanString(rawBody.phone),
          hireDate: cleanString(rawBody.hireDate),
          resignDate: cleanString(rawBody.resignDate),
          bankName: primaryBankAccount?.bankName?.trim() || null,
          accountNumber: primaryBankAccount?.accountNumber?.trim() || null,
          accountHolder: primaryBankAccount?.accountHolder?.trim() || null,
        },
      });
    } else {
      await prisma.otherIncomeLaborEmployee.update({
        where: { id: employeeId },
        data: {
          employeeCode: cleanString(rawBody.employeeCode),
          name,
          residentNumber: cleanString(rawBody.residentNumber),
          nationalityType: cleanString(rawBody.nationalityType),
          residenceType: cleanString(rawBody.residenceType),
          zipcode: cleanString(rawBody.zipcode),
          department: cleanString(rawBody.department),
          positionTitle: cleanString(rawBody.positionTitle),
          email: cleanString(rawBody.email),
          phone: cleanString(rawBody.phone),
          hireDate: cleanString(rawBody.hireDate),
          resignDate: cleanString(rawBody.resignDate),
          jobCategory: cleanString(rawBody.jobCategory),
          payType: cleanString(rawBody.payType),
          paymentMethod: cleanString(rawBody.paymentMethod),
          overtimeType: cleanString(rawBody.overtimeType),
          normalPay: cleanFloat(rawBody.normalPay),
          overtimePay: cleanFloat(rawBody.overtimePay),
          address: cleanString(rawBody.address),
          addressDetail: cleanString(rawBody.addressDetail),
          bankName: cleanString(rawBody.bankName),
          accountNumber: cleanString(rawBody.accountNumber),
          accountHolder: name,
          siteName: cleanString(rawBody.siteName),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "직원 정보가 수정되었습니다.",
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

    const deletedAt = new Date();
    if (incomeType === "EARNED_INCOME") {
      await prisma.$transaction([
        prisma.employeeBankAccount.updateMany({
          where: { employeeId, deletedAt: null },
          data: { deletedAt },
        }),
        prisma.employee.update({
          where: { id: employeeId },
          data: { deletedAt },
        }),
      ]);
    } else if (incomeType === "BUSINESS_INCOME") {
      await prisma.businessIncomeEmployee.update({
        where: { id: employeeId },
        data: { deletedAt },
      });
    } else if (incomeType === "OTHER_INCOME") {
      await prisma.otherIncomeEmployee.update({
        where: { id: employeeId },
        data: { deletedAt },
      });
    } else {
      await prisma.otherIncomeLaborEmployee.update({
        where: { id: employeeId },
        data: { deletedAt },
      });
    }

    return NextResponse.json({
      success: true,
      message: "직원이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json(
      { error: "직원 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
