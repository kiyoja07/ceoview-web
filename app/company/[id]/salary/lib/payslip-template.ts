import type {
  EarnedIncomeRow,
  BusinessIncomeRow,
  DailyIncomeLaborRow,
  OtherIncomeRow,
  Company,
  IncomeTab,
} from "../types";
import { formatNumber, formatBusinessNumber, formatYm } from "./format";

export interface PayslipItem {
  label: string;
  amount: number;
}

export interface PayslipData {
  companyName: string;
  businessNumber: string;
  employeeName: string;
  employeeCode: string;
  incomeTypeLabel: string;
  /** e.g. "기타소득" sub-type like "원고료" */
  incomeSubType?: string;
  department: string | null;
  position: string | null;
  accrualYm: string;
  paymentYm: string;
  payDate?: string;
  /** daily-specific */
  workDays?: number | null;
  normalHours?: string | null;
  overtimeHours?: string | null;
  paymentItems: PayslipItem[];
  deductionItems: PayslipItem[];
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
}

/* ───────── Shared types & constants ───────── */

export type IncomeRow =
  | EarnedIncomeRow
  | BusinessIncomeRow
  | DailyIncomeLaborRow
  | OtherIncomeRow;

export const INCOME_TYPE_LABELS: Record<IncomeTab, string> = {
  earned: "근로소득",
  business: "사업소득",
  daily: "일용직소득",
  other: "기타소득",
};

/* ───────── Payment / Deduction item extractors ───────── */

export function earnedPaymentItems(row: EarnedIncomeRow): PayslipItem[] {
  return [
    { label: "기본급", amount: Number(row.baseSalary) },
    { label: "상여", amount: Number(row.bonus) },
    { label: "식대", amount: Number(row.mealAllowance) },
    { label: "수당", amount: Number(row.allowance) },
    { label: "출장비", amount: Number(row.travelExpense) },
  ];
}

export function earnedDeductionItems(row: EarnedIncomeRow): PayslipItem[] {
  return [
    { label: "국민연금", amount: Number(row.nationalPensionDeduction) },
    { label: "건강보험", amount: Number(row.healthInsurance) },
    { label: "장기요양보험", amount: Number(row.longTermCareInsurance) },
    { label: "고용보험", amount: Number(row.employmentInsurance) },
    { label: "근로소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
    ...(row.dynamicDeductionItems ?? []).map((item) => ({
      label: item.name,
      amount: Number(item.amount),
    })),
  ];
}

export function businessPaymentItems(row: BusinessIncomeRow): PayslipItem[] {
  return [{ label: "지급액", amount: Number(row.grossPayment) }];
}

export function businessDeductionItems(row: BusinessIncomeRow): PayslipItem[] {
  return [
    { label: "소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
    { label: "예술/특고인 경비", amount: Number(row.expenseArtSpec) },
    { label: "고용보험료", amount: Number(row.employmentIns) },
    { label: "학자금상환액", amount: Number(row.studentLoan) },
    { label: "산재보험료", amount: Number(row.industrialAcc) },
  ];
}

export function dailyPaymentItems(row: DailyIncomeLaborRow): PayslipItem[] {
  return [{ label: "급여총액", amount: Number(row.grossPay) }];
}

export function dailyDeductionItems(row: DailyIncomeLaborRow): PayslipItem[] {
  return [
    { label: "고용보험료", amount: Number(row.employmentIns) },
    { label: "국민연금", amount: Number(row.nationalPension) },
    { label: "건강보험료", amount: Number(row.healthIns) },
    { label: "장기요양보험", amount: Number(row.longTermCare) },
    { label: "소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}

export function otherPaymentItems(row: OtherIncomeRow): PayslipItem[] {
  return [{ label: "지급액", amount: Number(row.grossPayment) }];
}

export function otherDeductionItems(row: OtherIncomeRow): PayslipItem[] {
  return [
    { label: "소득세/법인세", amount: Number(row.taxCorpTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}

export function getPaymentItems(row: IncomeRow, type: IncomeTab): PayslipItem[] {
  switch (type) {
    case "earned":
      return earnedPaymentItems(row as EarnedIncomeRow);
    case "business":
      return businessPaymentItems(row as BusinessIncomeRow);
    case "daily":
      return dailyPaymentItems(row as DailyIncomeLaborRow);
    case "other":
      return otherPaymentItems(row as OtherIncomeRow);
  }
}

export function getDeductionItems(row: IncomeRow, type: IncomeTab): PayslipItem[] {
  switch (type) {
    case "earned":
      return earnedDeductionItems(row as EarnedIncomeRow);
    case "business":
      return businessDeductionItems(row as BusinessIncomeRow);
    case "daily":
      return dailyDeductionItems(row as DailyIncomeLaborRow);
    case "other":
      return otherDeductionItems(row as OtherIncomeRow);
  }
}

export function getTotalPayment(row: IncomeRow, type: IncomeTab): number {
  switch (type) {
    case "earned":
      return Number((row as EarnedIncomeRow).totalPayment);
    case "business":
      return Number((row as BusinessIncomeRow).grossPayment);
    case "daily":
      return Number((row as DailyIncomeLaborRow).grossPay);
    case "other":
      return Number((row as OtherIncomeRow).grossPayment);
  }
}

export function getTotalDeduction(row: IncomeRow, type: IncomeTab): number {
  switch (type) {
    case "earned":
      return Number((row as EarnedIncomeRow).totalDeduction);
    case "business": {
      const b = row as BusinessIncomeRow;
      return (
        Number(b.incomeTax) +
        Number(b.localIncomeTax) +
        Number(b.expenseArtSpec) +
        Number(b.employmentIns) +
        Number(b.studentLoan) +
        Number(b.industrialAcc)
      );
    }
    case "daily": {
      const d = row as DailyIncomeLaborRow;
      return (
        Number(d.employmentIns) +
        Number(d.nationalPension) +
        Number(d.healthIns) +
        Number(d.longTermCare) +
        Number(d.incomeTax) +
        Number(d.localIncomeTax)
      );
    }
    case "other": {
      const o = row as OtherIncomeRow;
      return Number(o.taxCorpTax) + Number(o.localIncomeTax);
    }
  }
}

export function getNetPayment(row: IncomeRow, type: IncomeTab): number {
  switch (type) {
    case "earned":
      return Number((row as EarnedIncomeRow).netPayment);
    case "business":
      return Number((row as BusinessIncomeRow).netPayment);
    case "daily":
      return Number((row as DailyIncomeLaborRow).netPay);
    case "other":
      return Number((row as OtherIncomeRow).netPayment);
  }
}

/* ───────── IncomeRow → PayslipData bridge ───────── */

export function toPayslipData(
  row: IncomeRow,
  incomeType: IncomeTab,
  company: Company | null,
): PayslipData {
  const earned = incomeType === "earned" ? (row as EarnedIncomeRow) : null;
  const daily = incomeType === "daily" ? (row as DailyIncomeLaborRow) : null;
  const other = incomeType === "other" ? (row as OtherIncomeRow) : null;

  const getAccrualYm = (): string => {
    if (incomeType === "daily") return "—";
    return formatYm(
      (row as EarnedIncomeRow | BusinessIncomeRow | OtherIncomeRow).accrualYm,
    );
  };

  const getPaymentYm = (): string => {
    if (incomeType === "daily") return "—";
    return formatYm(
      (row as EarnedIncomeRow | BusinessIncomeRow | OtherIncomeRow).paymentYm,
    );
  };

  return {
    companyName: company?.businessName ?? "—",
    businessNumber: company?.businessNumber ?? "",
    employeeName: row.employeeName,
    employeeCode: row.employeeCode,
    incomeTypeLabel: INCOME_TYPE_LABELS[incomeType],
    incomeSubType: other?.incomeType ?? undefined,
    department: earned?.department ?? null,
    position: earned?.position ?? daily?.position ?? null,
    accrualYm: getAccrualYm(),
    paymentYm: getPaymentYm(),
    payDate: earned
      ? new Date(earned.payDate).toLocaleDateString("ko-KR")
      : undefined,
    workDays: daily?.workDays ?? undefined,
    normalHours: daily?.normalHours ?? undefined,
    overtimeHours: daily?.overtimeHours ?? undefined,
    paymentItems: getPaymentItems(row, incomeType),
    deductionItems: getDeductionItems(row, incomeType),
    totalPayment: getTotalPayment(row, incomeType),
    totalDeduction: getTotalDeduction(row, incomeType),
    netPayment: getNetPayment(row, incomeType),
  };
}

/**
 * Render payslip as inline-style HTML string.
 * Used for both email sending and print preview.
 */
export function renderPayslipHtml(p: PayslipData): string {
  const maxRows = Math.max(p.paymentItems.length, p.deductionItems.length);
  const th =
    'style="border:1px solid #d1d5db;padding:8px 12px;background:#f3f4f6;font-weight:600;font-size:13px;text-align:left;width:100px"';
  const td = 'style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px"';
  const tdBold =
    'style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;font-weight:600"';
  const tdAmount =
    'style="border:1px solid #d1d5db;padding:8px 12px;font-size:13px;text-align:right;font-variant-numeric:tabular-nums"';

  let itemRows = "";
  for (let i = 0; i < maxRows; i++) {
    const pay = p.paymentItems[i];
    const ded = p.deductionItems[i];
    itemRows += `<tr>
      <td ${td}>${pay?.label ?? ""}</td>
      <td ${tdAmount}>${pay ? formatNumber(pay.amount) : ""}</td>
      <td ${td}>${ded?.label ?? ""}</td>
      <td ${tdAmount}>${ded ? formatNumber(ded.amount) : ""}</td>
    </tr>`;
  }

  const deptPos = [p.department, p.position].filter(Boolean).join(" / ") || "—";

  const incomeTypeCell = p.incomeSubType
    ? `${p.incomeTypeLabel} / ${p.incomeSubType}`
    : p.incomeTypeLabel;

  let extraInfoRows = "";
  if (p.payDate) {
    extraInfoRows += `
      <tr>
        <th ${th}>지급일</th>
        <td ${td} colspan="3">${p.payDate}</td>
      </tr>`;
  }
  if (p.workDays != null) {
    extraInfoRows += `
      <tr>
        <th ${th}>근무일수</th>
        <td ${td}>${p.workDays}일</td>
        <th ${th}>근무시간</th>
        <td ${td}>정상 ${p.normalHours ?? "—"}h | 연장 ${p.overtimeHours ?? "—"}h</td>
      </tr>`;
  }

  return `
    <div style="max-width:600px;margin:0 auto;font-family:'Malgun Gothic','맑은 고딕',sans-serif;color:#1a1a1a">
      <h2 style="text-align:center;font-size:22px;font-weight:700;letter-spacing:8px;margin-bottom:24px">급 여 명 세 서</h2>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px">
        <tr>
          <th ${th}>회사명</th>
          <td ${td}>${p.companyName}</td>
            <th ${th}>사업자번호</th>
          <td ${td} colspan="3">${formatBusinessNumber(p.businessNumber)}</td>

        </tr>
        <tr>
          <th ${th}>사원명</th>
          <td ${tdBold} colspan="3">${p.employeeName}</td>
        </tr>
        <tr>
          <th ${th}>소득구분</th>
          <td ${td} colspan="3">${incomeTypeCell}</td>
        </tr>
        <tr>
          <th ${th}>귀속년월</th>
          <td ${td}>${p.accrualYm}</td>
          <th ${th}>지급년월</th>
          <td ${td}>${p.paymentYm}</td>
        </tr>
        ${extraInfoRows}
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px">
        <thead>
          <tr>
            <th colspan="2" style="border:1px solid #d1d5db;padding:8px 12px;background:#2563eb;color:#fff;font-weight:600;text-align:center">지급 항목</th>
            <th colspan="2" style="border:1px solid #d1d5db;padding:8px 12px;background:#e11d48;color:#fff;font-weight:600;text-align:center">공제 항목</th>
          </tr>
          <tr>
            <th style="border:1px solid #d1d5db;padding:8px 12px;background:#eff6ff;color:#1e40af;font-weight:600;text-align:center;width:25%">항목</th>
            <th style="border:1px solid #d1d5db;padding:8px 12px;background:#eff6ff;color:#1e40af;font-weight:600;text-align:center;width:25%">금액</th>
            <th style="border:1px solid #d1d5db;padding:8px 12px;background:#fff1f2;color:#9f1239;font-weight:600;text-align:center;width:25%">항목</th>
            <th style="border:1px solid #d1d5db;padding:8px 12px;background:#fff1f2;color:#9f1239;font-weight:600;text-align:center;width:25%">금액</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr style="background:#f3f4f6">
            <th style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-weight:700;color:#1d4ed8">지급액 계</th>
            <td style="border:1px solid #d1d5db;padding:8px 12px;text-align:right;font-weight:700;color:#1d4ed8;font-size:14px">${formatNumber(p.totalPayment)}</td>
            <th style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-weight:700;color:#e11d48">공제액 계</th>
            <td style="border:1px solid #d1d5db;padding:8px 12px;text-align:right;font-weight:700;color:#e11d48;font-size:14px">${formatNumber(p.totalDeduction)}</td>
          </tr>
        </tfoot>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:#ecfdf5">
          <th style="border:2px solid #6ee7b7;padding:10px 12px;text-align:center;font-weight:700;font-size:15px;color:#065f46;width:50%">실수령액 (차인지급액)</th>
          <td style="border:2px solid #6ee7b7;padding:10px 12px;text-align:right;font-weight:900;font-size:18px;color:#047857">₩ ${formatNumber(p.netPayment)}</td>
        </tr>
      </table>

      <p style="margin-top:16px;text-align:center;font-size:12px;color:#9ca3af">본 명세서는 전산 처리된 자료를 기반으로 작성되었습니다.</p>
    </div>
  `;
}
