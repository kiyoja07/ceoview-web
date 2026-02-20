import type { IncomeType } from "./types";

export const INCOME_TYPES: { value: IncomeType; label: string }[] = [
  { value: "EARNED_INCOME", label: "근로소득" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득" },
  { value: "BUSINESS_INCOME", label: "사업소득" },
  { value: "OTHER_INCOME", label: "기타소득" },
];

export const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
