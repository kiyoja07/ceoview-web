import type { SalaryIncomeType } from "./types";

export const REQUIRED_COLUMNS: Record<SalaryIncomeType, string[]> = {
  EARNED_INCOME: ["사원코드", "사원명", "지급액계", "공제액계", "차인지급액"],
  BUSINESS_INCOME: ["코드", "성   명", "지급액", "차인지급액"],
  OTHER_INCOME: ["코드", "성   명", "소득구분", "지급액", "차인지급액"],
  OTHER_INCOME_LABOR: ["코드", "성명", "급여총액", "차인지급액"],
};

export const INCOME_TYPE_LABELS: Record<SalaryIncomeType, string> = {
  EARNED_INCOME: "근로소득",
  BUSINESS_INCOME: "사업소득",
  OTHER_INCOME: "기타소득",
  OTHER_INCOME_LABOR: "일용소득",
};

export function isSalaryIncomeType(value: string): value is SalaryIncomeType {
  return value in REQUIRED_COLUMNS;
}
