import type {
  IncomeTypeOption,
  ProgramTypeOption,
} from "@/types/agent/employee";

export const INCOME_TYPES: IncomeTypeOption[] = [
  { value: "EARNED_INCOME", label: "근로소득자" },
  { value: "BUSINESS_INCOME", label: "사업소득자" },
  { value: "OTHER_INCOME", label: "기타소득자" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득자" },
];

export const PROGRAM_TYPES: ProgramTypeOption[] = [
  { value: "WEHAGO", label: "위하고" },
  { value: "TAXFRIEND", label: "세무사랑", disabled: true },
];
