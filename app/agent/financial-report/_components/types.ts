export type ReportInfo = {
  id: string;
  fileName: string | null;
  fiscalYear: number | null;
  period: string | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
  uploadedAt: string;
};

export type ActiveReportInfo = {
  id: string;
  fileName: string | null;
  fiscalYear: number | null;
  period: string | null;
  uploadedAt: string;
};

export type CompanyRow = {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  reportCount: number;
  latestReport: ReportInfo | null;
  activeReport: ActiveReportInfo | null;
  isPublished: boolean;
};

export type DashboardSummary = {
  totalCompanies: number;
  companiesWithReports: number;
  companiesPublished: number;
  totalReports: number;
};

export type DashboardResponse = {
  success: boolean;
  summary: DashboardSummary;
  companies: CompanyRow[];
};

export type FilterMode = "all" | "published" | "unpublished" | "no-report";
