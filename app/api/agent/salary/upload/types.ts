export type SalaryIncomeType =
  | "EARNED_INCOME"
  | "BUSINESS_INCOME"
  | "OTHER_INCOME"
  | "OTHER_INCOME_LABOR";

export type ParsedRows = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type EarnedIncomeOverrides = {
  accrualYm: number;
  paymentYm: number;
  payDate: Date;
};

export type IncomeWithYmOverrides = {
  accrualYm: number;
  paymentYm: number;
};

export type UploadSaveResult = {
  savedCount: number;
  uploadId: string;
  publishStatus: "SAVED";
};

export type SaveRowsByIncomeTypeParams = {
  incomeType: SalaryIncomeType;
  organizationId: bigint;
  agentUserId: bigint;
  companyId: string;
  fileName: string;
  rows: Record<string, unknown>[];
  accrualYm?: string | null;
  paymentYm?: string | null;
  payDateStr?: string | null;
};
