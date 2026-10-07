import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  EMPLOYEE_CODE_TAKEN_MESSAGE,
  isEmployeeCodeTaken,
} from "@/app/lib/employee-code";
import {
  sanitizeEmployeePayload,
  sanitizeBusinessIncomeEmployeePayload,
  sanitizeOtherIncomeEmployeePayload,
  sanitizeOtherIncomeLaborEmployeePayload,
} from "@/app/lib/company-input";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import type {
  EmployeeBankAccountBody,
  EmployeeCreateBody,
  BusinessIncomeEmployeeCreateBody,
  OtherIncomeEmployeeCreateBody,
  OtherIncomeLaborEmployeeCreateBody,
  EmployeeIncomeType,
} from "@/types/company/employees";

function getPrimaryBankAccount(body: {
  bankAccounts?: EmployeeBankAccountBody[] | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
}) {
  const bankAccount = body.bankAccounts?.find(
    (item) => item.bankName || item.accountNumber || item.accountHolder,
  );

  if (bankAccount) {
    return bankAccount;
  }

  if (body.bankName || body.accountNumber || body.accountHolder) {
    return {
      bankName: body.bankName ?? "",
      accountNumber: body.accountNumber ?? "",
      accountHolder: body.accountHolder ?? "",
    };
  }

  return null;
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
    let companyId: string;
    try {
      companyId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
        { status: 400 },
      );
    }

    // 권한 확인
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

    const rawBody = (await request.json()) as Record<string, unknown> & {
      incomeType?: EmployeeIncomeType;
    };
    const incomeType: EmployeeIncomeType =
      rawBody.incomeType ?? "EARNED_INCOME";

    let sanitizedBody: Record<string, unknown>;
    switch (incomeType) {
      case "BUSINESS_INCOME":
        sanitizedBody = sanitizeBusinessIncomeEmployeePayload(
          rawBody as unknown as BusinessIncomeEmployeeCreateBody,
        );
        break;
      case "OTHER_INCOME":
        sanitizedBody = sanitizeOtherIncomeEmployeePayload(
          rawBody as unknown as OtherIncomeEmployeeCreateBody,
        );
        break;
      case "OTHER_INCOME_LABOR":
        sanitizedBody = sanitizeOtherIncomeLaborEmployeePayload(
          rawBody as unknown as OtherIncomeLaborEmployeeCreateBody,
        );
        break;
      default:
        sanitizedBody = sanitizeEmployeePayload(
          rawBody as unknown as EmployeeCreateBody,
        );
        break;
    }

    const name = (sanitizedBody.name as string)?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    if (
      await isEmployeeCodeTaken({
        incomeType,
        companyId: companyId,
        employeeCode: sanitizedBody.employeeCode as string | null | undefined,
      })
    ) {
      return NextResponse.json(
        { error: EMPLOYEE_CODE_TAKEN_MESSAGE },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let createdId: string;
      let createdName: string;

      if (incomeType === "BUSINESS_INCOME") {
        const body = sanitizedBody as BusinessIncomeEmployeeCreateBody;
        const primaryBankAccount = getPrimaryBankAccount(body);
        const created = await tx.businessIncomeEmployee.create({
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
        createdId = created.id;
        createdName = created.name;
      } else if (incomeType === "OTHER_INCOME") {
        const body = sanitizedBody as OtherIncomeEmployeeCreateBody;
        const primaryBankAccount = getPrimaryBankAccount(body);
        const created = await tx.otherIncomeEmployee.create({
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
        createdId = created.id;
        createdName = created.name;
      } else if (incomeType === "OTHER_INCOME_LABOR") {
        const body = sanitizedBody as OtherIncomeLaborEmployeeCreateBody;
        const primaryBankAccount = getPrimaryBankAccount(body);
        const created = await tx.otherIncomeLaborEmployee.create({
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
        createdId = created.id;
        createdName = created.name;
      } else {
        const body = sanitizedBody as EmployeeCreateBody;
        const created = await tx.employee.create({
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
                  ?.filter(
                    (ba) => ba.bankName?.trim() && ba.accountNumber?.trim(),
                  )
                  .map((ba) => ({
                    bankName: ba.bankName.trim(),
                    accountNumber: ba.accountNumber.trim(),
                    accountHolder: ba.accountHolder?.trim() || name,
                  })) ?? [],
            },
          },
        });
        createdId = created.id;
        createdName = created.name;
      }

      return { id: createdId, name: createdName };
    });

    return NextResponse.json({
      id: result.id.toString(),
      name: result.name,
    });
  } catch (error) {
    console.error("Agent employee create error:", error);
    return NextResponse.json(
      { error: "직원 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
