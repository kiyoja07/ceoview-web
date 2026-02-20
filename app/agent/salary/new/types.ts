export interface BusinessEntity {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
}

export type IncomeType =
  | "EARNED_INCOME"
  | "BUSINESS_INCOME"
  | "OTHER_INCOME"
  | "OTHER_INCOME_LABOR";

export interface ParsedResult {
  success: boolean;
  saved: boolean;
  savedCount?: number;
  uploadId?: string;
  fileName: string;
  sheetName: string;
  incomeType: string;
  incomeTypeLabel: string;
  businessEntityId: string;
  accrualYm: string;
  totalRows: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

export type MessageState = {
  type: "success" | "error";
  text: string;
} | null;
