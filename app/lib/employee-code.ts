import prisma from "@/app/lib/prisma";
import type { EmployeeIncomeType } from "@/types/company/employees";

export const EMPLOYEE_CODE_TAKEN_MESSAGE = "이미 사용 중인 사원코드입니다.";

/**
 * 같은 회사·같은 소득자 유형에 사원코드가 이미 있는지 확인한다.
 * 사원코드는 비어 있을 수 있어 DB 고유 제약 대신 여기서 확인한다.
 * 엑셀 업로드가 사원코드로 기존 대상자를 찾아 갱신(삭제 표시 해제 포함)하므로,
 * 삭제 표시된 대상자의 코드도 사용 중으로 본다. 빈 코드는 확인하지 않는다.
 */
export async function isEmployeeCodeTaken(params: {
  incomeType: EmployeeIncomeType;
  companyId: string;
  employeeCode: string | null | undefined;
  excludeId?: string;
}): Promise<boolean> {
  const employeeCode = params.employeeCode?.trim();
  if (!employeeCode) return false;

  const where = {
    companyId: params.companyId,
    employeeCode,
    ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
  };
  const select = { id: true } as const;

  switch (params.incomeType) {
    case "BUSINESS_INCOME":
      return Boolean(
        await prisma.businessIncomeEmployee.findFirst({ where, select }),
      );
    case "OTHER_INCOME":
      return Boolean(
        await prisma.otherIncomeEmployee.findFirst({ where, select }),
      );
    case "OTHER_INCOME_LABOR":
      return Boolean(
        await prisma.otherIncomeLaborEmployee.findFirst({ where, select }),
      );
    default:
      return Boolean(await prisma.employee.findFirst({ where, select }));
  }
}
