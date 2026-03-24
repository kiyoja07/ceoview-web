import {
  SALARY_INCOME_TYPE_LABELS,
  SALARY_UPLOAD_REQUIRED_COLUMNS,
} from "@/catalogs/ko/salary";
import type { SalaryIncomeType } from "./types";

export const REQUIRED_COLUMNS = SALARY_UPLOAD_REQUIRED_COLUMNS;

export const INCOME_TYPE_LABELS: Record<SalaryIncomeType, string> =
  SALARY_INCOME_TYPE_LABELS;

export function isSalaryIncomeType(value: string): value is SalaryIncomeType {
  return value in REQUIRED_COLUMNS;
}
