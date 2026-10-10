import type { PayslipData } from "@/app/lib/payslip/payslip-template";

export type EmployeePayslipType = "earned" | "business" | "other" | "daily";

export type EmployeePayslipEntry = {
  id: string;
  type: EmployeePayslipType;
  incomeLabel: string;
  monthKey: string | null;
  monthLabel: string;
  metaLabel: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  payslipData: PayslipData;
};

export type EmployeePayslipMonthGroup = {
  monthKey: string;
  monthLabel: string;
  entries: EmployeePayslipEntry[];
};

/** GET /api/employee/payslips 응답 */
export type EmployeePayslipCollection = {
  monthGroups: EmployeePayslipMonthGroup[];
  undatedEntries: EmployeePayslipEntry[];
  allEntries: EmployeePayslipEntry[];
};
