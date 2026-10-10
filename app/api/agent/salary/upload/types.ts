import type { SalaryIncomeType } from "@/types/agent/salary";

export type { SalaryIncomeType };

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
  organizationId: string;
  agentUserId: string;
  companyId: string;
  fileName: string;
  rows: Record<string, unknown>[];
  accrualYm?: string | null;
  paymentYm?: string | null;
  payDateStr?: string | null;
};
