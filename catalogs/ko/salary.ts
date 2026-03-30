import type { KeyLabel, LabeledOption } from "@/catalogs/types";
import type { SalaryIncomeType } from "@/app/api/agent/salary/upload/types";
import type { IncomeTab } from "@/app/company/[id]/salary/types";
import type { FilterMode } from "@/app/agent/salary/_components/types";

export const SALARY_DASHBOARD_FILTER_OPTIONS: KeyLabel<FilterMode>[] = [
  { key: "all", label: "전체" },
  { key: "published", label: "발행완료" },
  { key: "unpublished", label: "미발행" },
  { key: "no-upload", label: "미등록" },
];

export const SALARY_INCOME_TYPE_OPTIONS: LabeledOption<SalaryIncomeType>[] = [
  { value: "EARNED_INCOME", label: "근로소득" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득" },
  { value: "BUSINESS_INCOME", label: "사업소득" },
  { value: "OTHER_INCOME", label: "기타소득" },
];

export const PROGRAM_TYPE_OPTIONS: LabeledOption<"WEHAGO" | "TAXFRIEND">[] = [
  { value: "WEHAGO", label: "위하고" },
  { value: "TAXFRIEND", label: "세무사랑", disabled: true },
];

export const SALARY_INCOME_TYPE_LABELS: Record<SalaryIncomeType, string> = {
  EARNED_INCOME: "근로소득",
  BUSINESS_INCOME: "사업소득",
  OTHER_INCOME: "기타소득",
  OTHER_INCOME_LABOR: "일용소득",
};

export const SALARY_INCOME_TYPES: SalaryIncomeType[] = [
  "EARNED_INCOME",
  "BUSINESS_INCOME",
  "OTHER_INCOME",
  "OTHER_INCOME_LABOR",
];

export const PAYSLIP_INCOME_TAB_LABELS: Record<IncomeTab, string> = {
  earned: "근로소득",
  business: "사업소득",
  daily: "일용직소득",
  other: "기타소득",
};

export const SALARY_UPLOAD_REQUIRED_COLUMNS: Record<
  SalaryIncomeType,
  string[]
> = {
  EARNED_INCOME: ["사원코드", "사원명", "지급액계", "공제액계", "차인지급액"],
  BUSINESS_INCOME: ["코드", "성   명", "지급액", "차인지급액"],
  OTHER_INCOME: ["코드", "성   명", "소득구분", "지급액", "차인지급액"],
  OTHER_INCOME_LABOR: ["코드", "성명", "급여총액", "차인지급액"],
};
