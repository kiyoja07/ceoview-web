import type { LabeledOption } from "@/catalogs/types";
import type {
  CompanyEmployeeDashboardSummary,
  EmployeeIncomeType,
  EmployeeStatus,
  EmployeeStatusFilter,
} from "@/types/company/employees";

export const EMPLOYEE_INCOME_TYPE_OPTIONS: LabeledOption<EmployeeIncomeType>[] =
  [
    { value: "EARNED_INCOME", label: "근로소득자" },
    { value: "BUSINESS_INCOME", label: "사업소득자" },
    { value: "OTHER_INCOME", label: "기타소득자" },
    { value: "OTHER_INCOME_LABOR", label: "일용소득자" },
  ];

export const EMPLOYEE_INCOME_TYPE_LABELS: Record<EmployeeIncomeType, string> = {
  EARNED_INCOME: "근로소득자",
  BUSINESS_INCOME: "사업소득자",
  OTHER_INCOME: "기타소득자",
  OTHER_INCOME_LABOR: "일용소득자",
};

export const EMPLOYEE_STATUS_FILTERS: Array<{
  value: EmployeeStatusFilter;
  label: string;
  getCount: (summary: CompanyEmployeeDashboardSummary) => number;
}> = [
  { value: "ALL", label: "전체", getCount: (summary) => summary.total },
  { value: "ACTIVE", label: "재직중", getCount: (summary) => summary.active },
  {
    value: "UPCOMING",
    label: "입사예정",
    getCount: (summary) => summary.upcoming,
  },
  {
    value: "LEAVING",
    label: "퇴사예정",
    getCount: (summary) => summary.leaving,
  },
  {
    value: "INACTIVE",
    label: "퇴사완료",
    getCount: (summary) => summary.inactive,
  },
];

export const EMPLOYEE_STATUS_TONE_CLASSES: Record<
  EmployeeStatus | "UNKNOWN",
  string
> = {
  재직중: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  입사예정: "bg-blue-50 text-blue-700 ring-blue-200",
  퇴사예정: "bg-amber-50 text-amber-700 ring-amber-200",
  퇴사완료: "bg-gray-100 text-gray-600 ring-gray-200",
  UNKNOWN: "bg-gray-100 text-gray-500 ring-gray-200",
};

export const EMPLOYEE_INCOME_TYPE_TONE_CLASSES: Record<
  EmployeeIncomeType,
  string
> = {
  EARNED_INCOME: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  BUSINESS_INCOME: "bg-sky-50 text-sky-700 ring-sky-200",
  OTHER_INCOME: "bg-violet-50 text-violet-700 ring-violet-200",
  OTHER_INCOME_LABOR: "bg-orange-50 text-orange-700 ring-orange-200",
};
