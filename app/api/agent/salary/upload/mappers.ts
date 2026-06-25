import type { EarnedIncomeOverrides, IncomeWithYmOverrides } from "./types";
import {
  EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT,
  EARNED_ITEM_CODE_HEALTH_INS_UNPAID_Q1,
} from "@/app/lib/payroll-items";
import {
  findInRow,
  toDateOrNull,
  toDecimal,
  toDecimalOrNull,
  toIntOrNull,
  toStringOrNull,
  toYearMonth,
} from "./utils";

export type EarnedIncomeDynamicItemInput = {
  code: string;
  amount: number;
};

export type MappedEarnedIncomeRow = {
  earnedIncomeData: {
    uploadId: string;
    employeeId?: string;
    accrualYm: number;
    paymentYm: number;
    payDate: Date;
    employeeCode: string;
    employeeName: string;
    department: string | null;
    position: string | null;
    jobType: string | null;
    baseSalary: number;
    bonus: number;
    mealAllowance: number;
    allowance: number;
    travelExpense: number;
    totalPayment: number;
    nationalPensionDeduction: number;
    healthInsurance: number;
    employmentInsurance: number;
    longTermCareInsurance: number;
    incomeTax: number;
    localIncomeTax: number;
    healthInsuranceAdj: number;
    nationalPensionAdj: number;
    employmentInsuranceAdj: number;
    longTermCareAdj: number;
    prepaidIncomeTax: number;
    prepaidLocalIncomeTax: number;
    addlIncomeTaxAdj: number;
    addlLocalIncomeTaxAdj: number;
    totalDeduction: number;
    netPayment: number;
  };
  dynamicItems: EarnedIncomeDynamicItemInput[];
};

export function mapEarnedIncomeRow(
  row: Record<string, unknown>,
  uploadId: string,
  overrides: EarnedIncomeOverrides,
): MappedEarnedIncomeRow {
  const studentLoanRepayment = toDecimal(row["학자금상환액"]);
  const healthInsUnpaidQ1 = toDecimal(row["1-3월 건강보험미납분"]);

  const dynamicItems: EarnedIncomeDynamicItemInput[] = [];
  if (studentLoanRepayment !== 0) {
    dynamicItems.push({
      code: EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT,
      amount: studentLoanRepayment,
    });
  }
  if (healthInsUnpaidQ1 !== 0) {
    dynamicItems.push({
      code: EARNED_ITEM_CODE_HEALTH_INS_UNPAID_Q1,
      amount: healthInsUnpaidQ1,
    });
  }

  return {
    earnedIncomeData: {
      uploadId,
      accrualYm: overrides.accrualYm,
      paymentYm: overrides.paymentYm,
      payDate: overrides.payDate,
      employeeCode: String(row["사원코드"] ?? ""),
      employeeName: String(row["사원명"] ?? ""),
      department: toStringOrNull(row["부서"]),
      position: toStringOrNull(row["직급"]),
      jobType: toStringOrNull(row["직종"]),
      baseSalary: toDecimal(row["수당_기본급"]),
      bonus: toDecimal(row["상여"]),
      mealAllowance: toDecimal(row["식대"]),
      allowance: toDecimal(row["수당"]),
      travelExpense: toDecimal(row["출장비"]),
      totalPayment: toDecimal(row["지급액계"]),
      nationalPensionDeduction: toDecimal(row["공제_국민연금"]),
      healthInsurance: toDecimal(row["건강보험"]),
      employmentInsurance: toDecimal(row["고용보험"]),
      longTermCareInsurance: toDecimal(row["장기요양보험료"]),
      incomeTax: toDecimal(row["소득세"]),
      localIncomeTax: toDecimal(row["지방소득세"]),
      healthInsuranceAdj: toDecimal(row["건강보험정산"]),
      nationalPensionAdj: toDecimal(row["국민연금정산"]),
      employmentInsuranceAdj: toDecimal(row["고용보험정산"]),
      longTermCareAdj: toDecimal(row["장기요양정산"]),
      prepaidIncomeTax: toDecimal(row["기납부소득세"]),
      prepaidLocalIncomeTax: toDecimal(row["기납부지방소득세"]),
      addlIncomeTaxAdj: toDecimal(row["추가정산소득세"]),
      addlLocalIncomeTaxAdj: toDecimal(row["추가정산지방소득세"]),
      totalDeduction: toDecimal(row["공제액계"]),
      netPayment: toDecimal(row["차인지급액"]),
    },
    dynamicItems,
  };
}

export function mapOtherIncomeLaborRow(
  row: Record<string, unknown>,
  uploadId: string,
) {
  return {
    uploadId,
    employeeCode: String(row["코드"] ?? ""),
    employeeName: String(row["성명"] ?? ""),
    jobType: toStringOrNull(row["직종"]),
    position: toStringOrNull(row["직급"]),
    identificationNumber: toStringOrNull(row["주민등록번호"]),
    address: toStringOrNull(row["주 소"]),
    phone: toStringOrNull(row["전화번호"]),
    joinDate: toDateOrNull(row["입사일"]),
    workDays: toIntOrNull(row["근무일수"]),
    normalHours: toDecimalOrNull(findInRow(row, "정상", "근무시간")),
    overtimeHours: toDecimalOrNull(row["연장"]),
    grossPay: toDecimal(row["급여총액"]),
    employmentIns: toDecimal(row["고용보험료"]),
    nationalPension: toDecimal(row["국민연금"]),
    healthIns: toDecimal(row["건강보험료"]),
    incomeTax: toDecimal(row["소득세"]),
    localIncomeTax: toDecimal(row["지방소득세"]),
    longTermCare: toDecimal(row["요양보험"]),
    netPay: toDecimal(row["차인지급액"]),
  };
}

export function mapBusinessIncomeRow(
  row: Record<string, unknown>,
  uploadId: string,
  overrides: IncomeWithYmOverrides,
) {
  return {
    uploadId,
    excelNo: toIntOrNull(findInRow(row, "NO")),
    employeeCode: String(findInRow(row, "코드") ?? ""),
    employeeName: String(findInRow(row, "성   명", "성명") ?? ""),
    accrualYm: toYearMonth(findInRow(row, "귀속년월")) || overrides.accrualYm,
    paymentYm: toYearMonth(findInRow(row, "지급년월")) || overrides.paymentYm,
    grossPayment: toDecimal(findInRow(row, "지급액")),
    incomeTax: toDecimal(
      findInRow(row, "소득세", "소득세/법인세", "원천징수세액"),
    ),
    localIncomeTax: toDecimal(findInRow(row, "지방소득세")),
    expenseArtSpec: toDecimal(
      findInRow(row, "예술/특고인 경비", "예술인 경비", "특고인 경비"),
    ),
    employmentIns: toDecimal(findInRow(row, "고용보험료", "고용보험")),
    studentLoan: toDecimal(findInRow(row, "학자금상환액")),
    industrialAcc: toDecimal(findInRow(row, "산재보험료", "산재보험")),
    netPayment: toDecimal(findInRow(row, "차인지급액")),
  };
}

export function mapOtherIncomeRow(
  row: Record<string, unknown>,
  uploadId: string,
  overrides: IncomeWithYmOverrides,
) {
  return {
    uploadId,
    excelNo: toIntOrNull(findInRow(row, "NO")),
    employeeCode: String(findInRow(row, "코드") ?? ""),
    employeeName: String(findInRow(row, "성   명", "성명") ?? ""),
    incomeType: String(findInRow(row, "소득구분") ?? ""),
    accrualYm: toYearMonth(findInRow(row, "귀속년월")) || overrides.accrualYm,
    paymentYm: toYearMonth(findInRow(row, "지급년월")) || overrides.paymentYm,
    grossPayment: toDecimal(findInRow(row, "지급액")),
    taxCorpTax: toDecimal(
      findInRow(row, "소득세/법인세", "소득세", "원천징수세액"),
    ),
    localIncomeTax: toDecimal(findInRow(row, "지방소득세")),
    netPayment: toDecimal(findInRow(row, "차인지급액")),
  };
}
