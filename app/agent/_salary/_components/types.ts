export type IncomeTypeStatus = {
  type: string;
  label: string;
  hasUpload: boolean;
  isPublished: boolean;
  latestUpload: {
    uploadId: string;
    fileName: string | null;
    uploadedAt: string;
  } | null;
  publishedAt: string | null;
};

export type CompanyRow = {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  uploadCount: number;
  uploadedTypeCount: number;
  publishedTypeCount: number;
  isFullyPublished: boolean;
  incomeTypes: IncomeTypeStatus[];
};

export type DashboardSummary = {
  totalCompanies: number;
  companiesWithUploads: number;
  companiesFullyPublished: number;
  totalUploads: number;
  totalPublished: number;
};

export type DashboardResponse = {
  success: boolean;
  summary: DashboardSummary;
  companies: CompanyRow[];
};

export type { SalaryDashboardFilterMode as FilterMode } from "@/types/agent/salary";
