import type { PayslipData } from "@/app/lib/payslip/payslip-template";

type NumericLike = number | string | { toString(): string };

type EarnedPayslipCompany = {
  businessName: string | null;
  businessNumber: string | null;
};

type EarnedPayslipItemValue = {
  amount: NumericLike;
  itemDefinition: {
    name: string;
    kind: "PAYMENT" | "DEDUCTION";
  };
};

type EarnedPayslipRow = {
  employeeName: string;
  employeeCode: string;
  department: string | null;
  position: string | null;
  accrualYm: number;
  paymentYm: number;
  payDate: Date | string;
  baseSalary: NumericLike;
  bonus: NumericLike;
  mealAllowance: NumericLike;
  allowance: NumericLike;
  travelExpense: NumericLike;
  totalPayment: NumericLike;
  nationalPensionDeduction: NumericLike;
  healthInsurance: NumericLike;
  longTermCareInsurance: NumericLike;
  employmentInsurance: NumericLike;
  incomeTax: NumericLike;
  localIncomeTax: NumericLike;
  totalDeduction: NumericLike;
  netPayment: NumericLike;
  itemValues: EarnedPayslipItemValue[];
};

function toNumber(value: NumericLike) {
  return Number(value);
}

export function formatPayslipYm(ym: number): string {
  const value = String(ym);
  return `${value.slice(0, 4)}-${value.slice(4)}`;
}

export function buildEarnedPayslipData(
  row: EarnedPayslipRow,
  company: EarnedPayslipCompany,
): PayslipData {
  return {
    companyName: company.businessName ?? "회사",
    businessNumber: company.businessNumber ?? "",
    employeeName: row.employeeName,
    employeeCode: row.employeeCode,
    incomeTypeLabel: "근로소득",
    department: row.department,
    position: row.position,
    accrualYm: formatPayslipYm(row.accrualYm),
    paymentYm: formatPayslipYm(row.paymentYm),
    payDate: new Date(row.payDate).toLocaleDateString("ko-KR"),
    paymentItems: [
      { label: "기본급", amount: toNumber(row.baseSalary) },
      { label: "상여", amount: toNumber(row.bonus) },
      { label: "식대", amount: toNumber(row.mealAllowance) },
      { label: "수당", amount: toNumber(row.allowance) },
      { label: "출장비", amount: toNumber(row.travelExpense) },
      ...row.itemValues
        .filter((item) => item.itemDefinition.kind === "PAYMENT")
        .map((item) => ({
          label: item.itemDefinition.name,
          amount: toNumber(item.amount),
        })),
    ],
    deductionItems: [
      { label: "국민연금", amount: toNumber(row.nationalPensionDeduction) },
      { label: "건강보험", amount: toNumber(row.healthInsurance) },
      { label: "장기요양보험", amount: toNumber(row.longTermCareInsurance) },
      { label: "고용보험", amount: toNumber(row.employmentInsurance) },
      { label: "소득세", amount: toNumber(row.incomeTax) },
      { label: "지방소득세", amount: toNumber(row.localIncomeTax) },
      ...row.itemValues
        .filter((item) => item.itemDefinition.kind === "DEDUCTION")
        .map((item) => ({
          label: item.itemDefinition.name,
          amount: toNumber(item.amount),
        })),
    ],
    totalPayment: toNumber(row.totalPayment),
    totalDeduction: toNumber(row.totalDeduction),
    netPayment: toNumber(row.netPayment),
  };
}
