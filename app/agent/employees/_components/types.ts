export type IncomeTypeEmployeeStatus = {
  type: string;
  label: string;
  activeCount: number;
  resignedCount: number;
  totalCount: number;
  savedCount: number;
  publishedCount: number;
};

export type CompanyRow = {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  totalCount: number;
  activeCount: number;
  resignedCount: number;
  savedCount: number;
  publishedCount: number;
  hasEmployees: boolean;
  isFullyPublished: boolean;
  hasUnpublished: boolean;
  incomeTypes: IncomeTypeEmployeeStatus[];
};

export type DashboardSummary = {
  totalCompanies: number;
  companiesWithEmployees: number;
  companiesFullyPublished: number;
  totalEmployees: number;
  totalActiveEmployees: number;
  totalResignedEmployees: number;
  totalSavedEmployees: number;
  totalPublishedEmployees: number;
};

export type DashboardResponse = {
  success: boolean;
  summary: DashboardSummary;
  companies: CompanyRow[];
};

export type FilterMode =
  | "all"
  | "has-employees"
  | "no-employees"
  | "published"
  | "unpublished";
