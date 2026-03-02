import type { IncomeTypeOption } from "./types";

export const INCOME_TYPES: IncomeTypeOption[] = [
  { value: "EARNED_INCOME", label: "근로소득" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득" },
  { value: "BUSINESS_INCOME", label: "사업소득" },
  { value: "OTHER_INCOME", label: "기타소득" },
];

export const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

export const PROGRAM_TYPES: import("./types").ProgramTypeOption[] = [
  { value: "WEHAGO", label: "위하고" },
  { value: "TAXFRIEND", label: "세무사랑", disabled: true },
];
