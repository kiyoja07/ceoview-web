export type IncomeTab = "earned" | "business" | "daily" | "other";
export type ViewMode = "dashboard" | IncomeTab;

export interface Company {
  id: string;
  businessName: string | null;
  businessNumber: string;
}

export interface EarnedIncomeDynamicItem {
  code: string;
  name: string;
  amount: string;
}

export interface EarnedIncomeRow {
  id: string;
  accrualYm: number;
  paymentYm: number;
  payDate: string;
  employeeCode: string;
  employeeName: string;
  department: string | null;
  position: string | null;
  baseSalary: string;
  bonus: string;
  mealAllowance: string;
  allowance: string;
  travelExpense: string;
  totalPayment: string;
  nationalPensionDeduction: string;
  healthInsurance: string;
  employmentInsurance: string;
  longTermCareInsurance: string;
  incomeTax: string;
  localIncomeTax: string;
  studentLoanRepayment: string;
  dynamicPaymentItems?: EarnedIncomeDynamicItem[];
  dynamicDeductionItems?: EarnedIncomeDynamicItem[];
  totalDeduction: string;
  netPayment: string;
}

export interface BusinessIncomeRow {
  id: string;
  accrualYm: number;
  paymentYm: number;
  employeeCode: string;
  employeeName: string;
  grossPayment: string;
  incomeTax: string;
  localIncomeTax: string;
  expenseArtSpec: string;
  employmentIns: string;
  studentLoan: string;
  industrialAcc: string;
  netPayment: string;
}

export interface DailyIncomeLaborRow {
  id: string;
  employeeCode: string;
  employeeName: string;
  jobType: string | null;
  position: string | null;
  identificationNumber: string | null;
  address: string | null;
  phone: string | null;
  joinDate: string | null;
  workDays: number | null;
  normalHours: string | null;
  overtimeHours: string | null;
  grossPay: string;
  employmentIns: string;
  nationalPension: string;
  healthIns: string;
  incomeTax: string;
  localIncomeTax: string;
  longTermCare: string;
  netPay: string;
}

export interface OtherIncomeRow {
  id: string;
  accrualYm: number;
  paymentYm: number;
  employeeCode: string;
  employeeName: string;
  incomeType: string;
  grossPayment: string;
  taxCorpTax: string;
  localIncomeTax: string;
  netPayment: string;
}

interface BaseApiResponse<T> {
  company: Company;
  rows: T[];
  total: number;
  page: number;
  size: number;
}

export type EarnedApiResponse = BaseApiResponse<EarnedIncomeRow>;
export type BusinessApiResponse = BaseApiResponse<BusinessIncomeRow>;
export type DailyApiResponse = BaseApiResponse<DailyIncomeLaborRow>;
export type OtherApiResponse = BaseApiResponse<OtherIncomeRow>;

export type ActiveIncomeData =
  | EarnedApiResponse
  | BusinessApiResponse
  | DailyApiResponse
  | OtherApiResponse;

export interface IncomeSummary {
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  count: number;
  companyBurden?: number;
}

export interface IncomeMeta {
  label: string;
  gradient: string;
  shadowColor: string;
  iconPath: string;
}

/* ── 월별 급여 통계 ── */

export interface MonthlyStat {
  ym: number;
  label: string;
  earnedPayment: number;
  businessPayment: number;
  dailyPayment: number;
  otherPayment: number;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
}

export interface SalaryStatsResponse {
  company: Company;
  months: number;
  stats: MonthlyStat[];
}
