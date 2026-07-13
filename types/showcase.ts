import type { PayslipData } from "@/app/company/[id]/salary/lib/payslip-template";

export type ShowcaseSlug = string;

export type ShowcaseMetricTone = "slate" | "blue" | "emerald" | "amber";

export type ShowcaseMetric = {
  label: string;
  value: string;
  description?: string;
  tone?: ShowcaseMetricTone;
};

export type ShowcaseAction = {
  title: string;
  description: string;
  href: string;
  label: string;
  disabled?: boolean;
};

export type ShowcaseAgentCompanyRow = {
  id: string;
  name: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  representativeName: string;
  createdAt: string;
  updatedAt: string;
  badgeLabel: string;
  badgeTone: "emerald" | "amber" | "slate";
  uploadedTypeCount: number;
  publishedTypeCount: number;
  note: string;
};

export type ShowcaseSalaryTrendPoint = {
  label: string;
  grossAmount: number;
  netAmount: number;
};

export type ShowcaseSalaryRow = {
  employeeName: string;
  incomeLabel: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  statusLabel: string;
};

export type ShowcasePayslipListItem = {
  monthLabel: string;
  incomeLabel: string;
  metaLabel: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
};

export type ShowcaseField = {
  label: string;
  value: string;
};

export type ShowcasePublicMeta = {
  slug: ShowcaseSlug;
  title: string;
  subtitle: string;
  companyName: string;
  industry: string;
  headcountLabel: string;
  recentPayrollLabel: string;
  headline: string;
  summary: string;
  highlights: string[];
};

export type ShowcaseAgentSnapshot = {
  organizationName: string;
  subtitle: string;
  overviewMetrics: ShowcaseMetric[];
  payrollMetrics: ShowcaseMetric[];
  employeeMetrics: ShowcaseMetric[];
  companies: ShowcaseAgentCompanyRow[];
};

export type ShowcaseCompanySnapshot = {
  businessName: string;
  businessNumber: string;
  representativeName: string;
  agentOrganizationName: string;
  heroSummary: string;
  dashboardMetrics: ShowcaseMetric[];
  employeeMetrics: ShowcaseMetric[];
  quickActions: ShowcaseAction[];
  salaryMetrics: ShowcaseMetric[];
  salaryTrend: ShowcaseSalaryTrendPoint[];
  salaryRows: ShowcaseSalaryRow[];
};

export type ShowcaseEmployeeSnapshot = {
  employeeName: string;
  department: string;
  position: string;
  companyName: string;
  recentSummary: ShowcasePayslipListItem;
  monthlyPayslips: ShowcasePayslipListItem[];
  profileFields: ShowcaseField[];
  bankFields: ShowcaseField[];
  payslipMetaLabel: string;
  payslipIncomeLabel: string;
  payslipData: PayslipData;
};

export type ShowcaseSalaryUploadRow = {
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
};

export type ShowcaseSalaryUploadSnapshot = {
  companyName: string;
  businessNumber: string;
  incomeTypeLabel: string;
  programTypeLabel: string;
  accrualYm: string;
  paymentYm: string;
  payDate: string;
  fileName: string;
  fileSize: string;
  totalRows: number;
  columns: string[];
  rows: ShowcaseSalaryUploadRow[];
};

export type ShowcaseScenario = {
  public: ShowcasePublicMeta;
  agent: ShowcaseAgentSnapshot;
  company: ShowcaseCompanySnapshot;
  employee: ShowcaseEmployeeSnapshot;
  salaryUpload: ShowcaseSalaryUploadSnapshot;
};
