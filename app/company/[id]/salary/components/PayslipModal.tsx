"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { EarnedWithholdingReceiptTable } from "./EarnedWithholdingReceiptTable";
import type {
  EarnedIncomeRow,
  BusinessIncomeRow,
  DailyIncomeLaborRow,
  OtherIncomeRow,
  BusinessEntity,
  IncomeTab,
} from "../types";
import { formatNumber, formatYm, formatBusinessNumber } from "../lib/format";

/* ───────── Payslip item helpers ───────── */

interface PayslipItem {
  label: string;
  amount: number;
}

function earnedPaymentItems(row: EarnedIncomeRow): PayslipItem[] {
  return [
    { label: "기본급", amount: Number(row.baseSalary) },
    { label: "상여", amount: Number(row.bonus) },
    { label: "식대", amount: Number(row.mealAllowance) },
    { label: "수당", amount: Number(row.allowance) },
    { label: "출장비", amount: Number(row.travelExpense) },
  ];
}

function earnedDeductionItems(row: EarnedIncomeRow): PayslipItem[] {
  return [
    { label: "국민연금", amount: Number(row.nationalPensionDeduction) },
    { label: "건강보험", amount: Number(row.healthInsurance) },
    { label: "장기요양보험", amount: Number(row.longTermCareInsurance) },
    { label: "고용보험", amount: Number(row.employmentInsurance) },
    { label: "근로소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}

function businessPaymentItems(row: BusinessIncomeRow): PayslipItem[] {
  return [{ label: "지급액", amount: Number(row.grossPayment) }];
}

function businessDeductionItems(row: BusinessIncomeRow): PayslipItem[] {
  return [
    { label: "소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
    { label: "예술/특고인 경비", amount: Number(row.expenseArtSpec) },
    { label: "고용보험료", amount: Number(row.employmentIns) },
    { label: "학자금상환액", amount: Number(row.studentLoan) },
    { label: "산재보험료", amount: Number(row.industrialAcc) },
  ];
}

function dailyPaymentItems(row: DailyIncomeLaborRow): PayslipItem[] {
  return [{ label: "급여총액", amount: Number(row.grossPay) }];
}

function dailyDeductionItems(row: DailyIncomeLaborRow): PayslipItem[] {
  return [
    { label: "고용보험료", amount: Number(row.employmentIns) },
    { label: "국민연금", amount: Number(row.nationalPension) },
    { label: "건강보험료", amount: Number(row.healthIns) },
    { label: "장기요양보험", amount: Number(row.longTermCare) },
    { label: "소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}

function otherPaymentItems(row: OtherIncomeRow): PayslipItem[] {
  return [{ label: "지급액", amount: Number(row.grossPayment) }];
}

function otherDeductionItems(row: OtherIncomeRow): PayslipItem[] {
  return [
    { label: "소득세/법인세", amount: Number(row.taxCorpTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}

/* ───────── Types ───────── */

type IncomeRow =
  | EarnedIncomeRow
  | BusinessIncomeRow
  | DailyIncomeLaborRow
  | OtherIncomeRow;

interface PayslipModalProps {
  row: IncomeRow;
  incomeType: IncomeTab;
  businessEntity: BusinessEntity | null;
  onClose: () => void;
}

type EarnedDocumentView = "payslip" | "withholding";

/* ───────── Helpers ───────── */

const INCOME_TYPE_LABELS: Record<IncomeTab, string> = {
  earned: "근로소득",
  business: "사업소득",
  daily: "일용직소득",
  other: "기타소득",
};

function getEmployeeName(row: IncomeRow): string {
  return row.employeeName;
}

function getEmployeeCode(row: IncomeRow): string {
  return row.employeeCode;
}

function getAccrualYm(row: IncomeRow, type: IncomeTab): string {
  if (type === "daily") return "—";
  return formatYm(
    (row as EarnedIncomeRow | BusinessIncomeRow | OtherIncomeRow).accrualYm,
  );
}

function getPaymentYm(row: IncomeRow, type: IncomeTab): string {
  if (type === "daily") return "—";
  return formatYm(
    (row as EarnedIncomeRow | BusinessIncomeRow | OtherIncomeRow).paymentYm,
  );
}

function getPayDate(row: IncomeRow, type: IncomeTab): string {
  if (type === "earned") {
    const earned = row as EarnedIncomeRow;
    return new Date(earned.payDate).toLocaleDateString("ko-KR");
  }
  return "—";
}

function getDepartment(row: IncomeRow, type: IncomeTab): string {
  if (type === "earned") return (row as EarnedIncomeRow).department ?? "—";
  return "—";
}

function getPosition(row: IncomeRow, type: IncomeTab): string {
  if (type === "earned") return (row as EarnedIncomeRow).position ?? "—";
  if (type === "daily") return (row as DailyIncomeLaborRow).position ?? "—";
  return "—";
}

function getPaymentItems(row: IncomeRow, type: IncomeTab): PayslipItem[] {
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

function getDeductionItems(row: IncomeRow, type: IncomeTab): PayslipItem[] {
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

function getTotalPayment(row: IncomeRow, type: IncomeTab): number {
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

function getTotalDeduction(row: IncomeRow, type: IncomeTab): number {
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

function getNetPayment(row: IncomeRow, type: IncomeTab): number {
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

/* ───────── Component ───────── */

export function PayslipModal({
  row,
  incomeType,
  businessEntity,
  onClose,
}: PayslipModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [earnedDocumentView, setEarnedDocumentView] =
    useState<EarnedDocumentView>("payslip");

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  const paymentItems = getPaymentItems(row, incomeType);
  const deductionItems = getDeductionItems(row, incomeType);
  const totalPayment = getTotalPayment(row, incomeType);
  const totalDeduction = getTotalDeduction(row, incomeType);
  const netPayment = getNetPayment(row, incomeType);
  const isEarnedWithholdingView =
    incomeType === "earned" && earnedDocumentView === "withholding";
  const documentTitle = isEarnedWithholdingView
    ? "근로소득원천징수영수증"
    : "급여명세서";

  const maxRows = Math.max(paymentItems.length, deductionItems.length);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle} - ${getEmployeeName(row)}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1a1a1a; }
            .payslip { max-width: 210mm; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; }
            th { background: #f3f4f6; font-weight: 600; }
            .title { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 20px; letter-spacing: 8px; }
            .section-header { background: #1e40af; color: white; font-weight: 600; font-size: 13px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { background: #eff6ff; font-weight: 700; }
            .net-row { background: #ecfdf5; font-weight: 700; font-size: 15px; }
            .amount { font-variant-numeric: tabular-nums; text-align: right; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="my-8 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
              {documentTitle}
            </span>
            <span className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
              {INCOME_TYPE_LABELS[incomeType]}
            </span>
            {/* {incomeType === "earned" && (
              <div className="ml-1 inline-flex rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-gray-200">
                <button
                  type="button"
                  onClick={() => setEarnedDocumentView("payslip")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    earnedDocumentView === "payslip"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  급여명세서
                </button>
                <button
                  type="button"
                  onClick={() => setEarnedDocumentView("withholding")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    earnedDocumentView === "withholding"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  원천징수영수증
                </button>
              </div>
            )} */}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-95"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z"
                />
              </svg>
              인쇄
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-gray-600 active:scale-95"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Payslip Card */}
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-gray-950/5">
          <div ref={printRef}>
            {isEarnedWithholdingView ? (
              <div className="p-8">
                {/* <EarnedWithholdingReceiptTable
                  row={row as EarnedIncomeRow}
                  businessEntity={businessEntity}
                /> */}
              </div>
            ) : (
              <div className="payslip p-8">
                {/* Title */}
                <h2 className="mb-6 text-center text-2xl font-bold tracking-[0.5em] text-gray-900">
                  급 여 명 세 서
                </h2>

                {/* Company & Employee Info */}
                <table className="mb-4 w-full border-collapse text-sm">
                  <tbody>
                    <tr>
                      <th className="w-24 border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        회사명
                      </th>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800">
                        {businessEntity?.businessName ?? "—"}
                      </td>
                      <th className="w-24 border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        사원명
                      </th>
                      <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                        {getEmployeeName(row)}
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        사업자번호
                      </th>
                      <td className="border border-gray-300 px-3 py-2 font-mono text-sm text-gray-700">
                        {businessEntity
                          ? formatBusinessNumber(businessEntity.businessNumber)
                          : "—"}
                      </td>
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        사원코드
                      </th>
                      <td className="border border-gray-300 px-3 py-2 font-mono text-sm text-gray-600">
                        {getEmployeeCode(row)}
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        소득구분
                      </th>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {INCOME_TYPE_LABELS[incomeType]}
                        </span>
                        {incomeType === "other" && (
                          <span className="ml-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            {(row as OtherIncomeRow).incomeType}
                          </span>
                        )}
                      </td>
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        부서/직급
                      </th>
                      <td className="border border-gray-300 px-3 py-2 text-gray-700">
                        {getDepartment(row, incomeType)}
                        {getPosition(row, incomeType) !== "—" && (
                          <span className="text-gray-400">
                            {" "}
                            / {getPosition(row, incomeType)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        귀속년월
                      </th>
                      <td className="border border-gray-300 px-3 py-2 font-mono text-sm text-gray-700">
                        {getAccrualYm(row, incomeType)}
                      </td>
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                        지급년월
                      </th>
                      <td className="border border-gray-300 px-3 py-2 font-mono text-sm text-gray-700">
                        {getPaymentYm(row, incomeType)}
                      </td>
                    </tr>
                    {incomeType === "earned" && (
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                          지급일
                        </th>
                        <td
                          colSpan={3}
                          className="border border-gray-300 px-3 py-2 text-gray-700"
                        >
                          {getPayDate(row, incomeType)}
                        </td>
                      </tr>
                    )}
                    {incomeType === "daily" && (
                      <tr>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                          근무일수
                        </th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-700">
                          {(row as DailyIncomeLaborRow).workDays ?? "—"}일
                        </td>
                        <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                          근무시간
                        </th>
                        <td className="border border-gray-300 px-3 py-2 text-gray-700">
                          정상 {(row as DailyIncomeLaborRow).normalHours ?? "—"}
                          h<span className="mx-1 text-gray-300">|</span>
                          연장{" "}
                          {(row as DailyIncomeLaborRow).overtimeHours ?? "—"}h
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Payment & Deduction Table */}
                <table className="mb-4 w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="border border-gray-300 bg-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
                      >
                        지급 항목
                      </th>
                      <th
                        colSpan={2}
                        className="border border-gray-300 bg-rose-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
                      >
                        공제 항목
                      </th>
                    </tr>
                    <tr>
                      <th className="w-1/4 border border-gray-300 bg-blue-50 px-3 py-2 text-center text-xs font-semibold text-blue-800">
                        항목
                      </th>
                      <th className="w-1/4 border border-gray-300 bg-blue-50 px-3 py-2 text-center text-xs font-semibold text-blue-800">
                        금액
                      </th>
                      <th className="w-1/4 border border-gray-300 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-800">
                        항목
                      </th>
                      <th className="w-1/4 border border-gray-300 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-800">
                        금액
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxRows }).map((_, i) => {
                      const payItem = paymentItems[i];
                      const dedItem = deductionItems[i];
                      return (
                        <tr key={i}>
                          <td className="border border-gray-300 px-3 py-2 text-gray-700">
                            {payItem?.label ?? ""}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono tabular-nums text-gray-800">
                            {payItem ? formatNumber(payItem.amount) : ""}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-700">
                            {dedItem?.label ?? ""}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono tabular-nums text-gray-800">
                            {dedItem ? formatNumber(dedItem.amount) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2.5 text-center font-semibold text-blue-700">
                        지급액 계
                      </th>
                      <td className="border border-gray-300 px-3 py-2.5 text-right font-mono text-base font-bold tabular-nums text-blue-700">
                        {formatNumber(totalPayment)}
                      </td>
                      <th className="border border-gray-300 px-3 py-2.5 text-center font-semibold text-rose-600">
                        공제액 계
                      </th>
                      <td className="border border-gray-300 px-3 py-2.5 text-right font-mono text-base font-bold tabular-nums text-rose-600">
                        {formatNumber(totalDeduction)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Net Payment */}
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr className="bg-emerald-50">
                      <th className="w-1/2 border-2 border-emerald-300 px-4 py-3 text-center text-base font-bold text-emerald-800">
                        실수령액 (차인지급액)
                      </th>
                      <td className="w-1/2 border-2 border-emerald-300 px-4 py-3 text-right font-mono text-xl font-black tabular-nums text-emerald-700">
                        ₩ {formatNumber(netPayment)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer */}
                <p className="mt-4 text-center text-xs text-gray-400">
                  본 명세서는 전산 처리된 자료를 기반으로 작성되었습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
