import type {
  CompanyEmployeeDashboardSummary,
  EmployeeIncomeType,
} from "@/types/company/employees";

export type DashboardEmployeeRow = {
  id: string;
  employeeCode: string | null;
  name: string;
  residentNumber: string | null;
  department: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  resignDate: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  incomeType: EmployeeIncomeType;
  incomeTypeLabel: string;
  canViewDetail: boolean;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
};

export type EmployeeListResponse = {
  employees: DashboardEmployeeRow[];
  summary: CompanyEmployeeDashboardSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type EmployeeSortOption = "EMPLOYEE_CODE" | "NAME";
