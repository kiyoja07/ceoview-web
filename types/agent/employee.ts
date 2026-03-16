export interface Company {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
}

export interface EmployeeMappedRow extends Record<string, unknown> {
  _employeeCode: string;
  _hasSalaryMatch: boolean;
  _salaryEmployeeName: string | null;
  _alreadyRegistered: boolean;
}

export interface EmployeeUploadResult {
  success: boolean;
  saved: boolean;
  savedCount?: number;
  skippedCount?: number;
  fileName: string;
  sheetName: string;
  companyId: string;
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  alreadyRegisteredCount: number;
  columns: string[];
  rows: EmployeeMappedRow[];
}

export type IncomeType =
  | "EARNED_INCOME"
  | "BUSINESS_INCOME"
  | "OTHER_INCOME"
  | "OTHER_INCOME_LABOR";

export type ProgramType = "WEHAGO" | "TAXFRIEND";

export type IncomeTypeOption = { value: IncomeType; label: string };

export type ProgramTypeOption = {
  value: ProgramType;
  label: string;
  disabled?: boolean;
};

export type MessageState = {
  type: "success" | "error";
  text: string;
} | null;
