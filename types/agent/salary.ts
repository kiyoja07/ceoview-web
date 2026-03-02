import type { ChangeEvent, RefObject } from "react";

export interface Company {
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
  published?: boolean;
  publishStatus?: "SAVED" | "PUBLISHED";
  companyVisible?: boolean;
  savedCount?: number;
  uploadId?: string;
  fileName: string;
  sheetName: string;
  incomeType: string;
  incomeTypeLabel: string;
  companyId: string;
  accrualYm: string;
  totalRows: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

export type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

export type UseSalaryUploadParams = {
  companyId: string;
  file: File | null;
  accrualYear: string;
  accrualMonth: string;
  paymentYear: string;
  paymentMonth: string;
  payDate: string;
  incomeType: IncomeType;
};

export type IncomeTypeOption = {
  value: IncomeType;
  label: string;
};

export type ProgramType = "WEHAGO" | "TAXFRIEND";

export type ProgramTypeOption = {
  value: ProgramType;
  label: string;
  disabled?: boolean;
};

export type CompanySelectProps = {
  companiesLoading: boolean;
  companies: Company[];
  companyId: string;
  onChange: (value: string) => void;
  selectedCompany?: Company;
};

export type FileUploadFieldProps = {
  file: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export type IncomeTypeSelectorProps = {
  incomeType: IncomeType;
  options: IncomeTypeOption[];
  onChange: (value: IncomeType) => void;
};

export type PayDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  hint?: string;
};

export type ResultPreviewProps = {
  result: ParsedResult;
  saving: boolean;
  publishing: boolean;
  onSave: () => void;
  onPublish: () => void;
};

export type StatusMessageProps = {
  message: MessageState;
};

export type YearMonthFieldProps = {
  label: string;
  year: string;
  month: string;
  years: string[];
  months: string[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
};
