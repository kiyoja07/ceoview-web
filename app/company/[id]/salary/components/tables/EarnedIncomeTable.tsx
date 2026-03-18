import { useMemo, useState } from "react";
import { EmptyRow } from "../EmptyRow";
import type { EarnedIncomeRow } from "../../types";

const PAYMENT_COLS = [
  { key: "baseSalary", label: "기본급" },
  { key: "bonus", label: "상여" },
  { key: "mealAllowance", label: "식대" },
  { key: "allowance", label: "수당" },
  { key: "travelExpense", label: "출장비" },
] as const;

const DEDUCTION_COLS = [
  { key: "nationalPensionDeduction", label: "국민연금" },
  { key: "healthInsurance", label: "건강보험" },
  { key: "employmentInsurance", label: "고용보험" },
  { key: "longTermCareInsurance", label: "장기요양" },
  { key: "incomeTax", label: "소득세" },
  { key: "localIncomeTax", label: "지방소득세" },
] as const;

const COMPANY_BURDEN_COLS = [
  { key: "companyNationalPension", label: "국민연금" },
  { key: "companyHealthInsurance", label: "건강보험" },
  { key: "companyLongTermCare", label: "장기요양" },
  { key: "companyEmploymentInsurance", label: "고용보험" },
  { key: "companyIndustrialAccident", label: "산재보험" },
  { key: "severancePay", label: "퇴직금" },
] as const;

type CompanyBurdenKey = (typeof COMPANY_BURDEN_COLS)[number]["key"];
type CompanyBurdenData = Record<
  CompanyBurdenKey | "totalCompanyBurden",
  number
>;

// 산재보험 평균 요율 (업종별 상이)
const INDUSTRIAL_ACCIDENT_RATE = 0.007;

function computeCompanyBurden(row: EarnedIncomeRow): CompanyBurdenData {
  const companyNationalPension = Number(row.nationalPensionDeduction);
  const companyHealthInsurance = Number(row.healthInsurance);
  const companyLongTermCare = Number(row.longTermCareInsurance);
  const companyEmploymentInsurance = Number(row.employmentInsurance);
  const totalPay = Number(row.totalPayment);
  const companyIndustrialAccident = Math.round(
    totalPay * INDUSTRIAL_ACCIDENT_RATE,
  );
  const severancePay = Math.round(totalPay / 12);

  return {
    companyNationalPension,
    companyHealthInsurance,
    companyLongTermCare,
    companyEmploymentInsurance,
    companyIndustrialAccident,
    severancePay,
    totalCompanyBurden:
      companyNationalPension +
      companyHealthInsurance +
      companyLongTermCare +
      companyEmploymentInsurance +
      companyIndustrialAccident +
      severancePay,
  };
}

type HideableKey =
  | (typeof PAYMENT_COLS)[number]["key"]
  | (typeof DEDUCTION_COLS)[number]["key"];

interface EarnedIncomeTableProps {
  rows: EarnedIncomeRow[];
  formatYm: (ym: number) => string;
  formatNumber: (v: string | number) => string;
  onRowClick?: (row: EarnedIncomeRow) => void;
}

export function EarnedIncomeTable({
  rows,
  formatYm,
  formatNumber,
  onRowClick,
}: EarnedIncomeTableProps) {
  const [showBasicDetail, setShowBasicDetail] = useState(true);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(true);
  const [showPaymentDetail, setShowPaymentDetail] = useState(true);
  const [showDeductionDetail, setShowDeductionDetail] = useState(true);
  const [showCompanyBurdenDetail, setShowCompanyBurdenDetail] = useState(true);

  const hiddenCols = useMemo(() => {
    if (!rows.length) return new Set<HideableKey>();
    const hidden = new Set<HideableKey>();
    for (const { key } of [...PAYMENT_COLS, ...DEDUCTION_COLS]) {
      if (rows.every((r) => Number(r[key]) === 0)) {
        hidden.add(key);
      }
    }
    return hidden;
  }, [rows]);

  const show = (key: HideableKey) => !hiddenCols.has(key);
  const visiblePaymentCount =
    PAYMENT_COLS.filter((c) => show(c.key)).length + 1;
  const visibleDeductionCount =
    DEDUCTION_COLS.filter((c) => show(c.key)).length + 1;

  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      baseSalary: rows.reduce((s, r) => s + Number(r.baseSalary), 0),
      bonus: rows.reduce((s, r) => s + Number(r.bonus), 0),
      mealAllowance: rows.reduce((s, r) => s + Number(r.mealAllowance), 0),
      allowance: rows.reduce((s, r) => s + Number(r.allowance), 0),
      travelExpense: rows.reduce((s, r) => s + Number(r.travelExpense), 0),
      totalPayment: rows.reduce((s, r) => s + Number(r.totalPayment), 0),
      nationalPensionDeduction: rows.reduce(
        (s, r) => s + Number(r.nationalPensionDeduction),
        0,
      ),
      healthInsurance: rows.reduce((s, r) => s + Number(r.healthInsurance), 0),
      employmentInsurance: rows.reduce(
        (s, r) => s + Number(r.employmentInsurance),
        0,
      ),
      longTermCareInsurance: rows.reduce(
        (s, r) => s + Number(r.longTermCareInsurance),
        0,
      ),
      incomeTax: rows.reduce((s, r) => s + Number(r.incomeTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      totalDeduction: rows.reduce((s, r) => s + Number(r.totalDeduction), 0),
      netPayment: rows.reduce((s, r) => s + Number(r.netPayment), 0),
    };
  }, [rows]);

  const companyBurden = useMemo(() => {
    const byRow = new Map<string, CompanyBurdenData>();
    const total: CompanyBurdenData = {
      companyNationalPension: 0,
      companyHealthInsurance: 0,
      companyLongTermCare: 0,
      companyEmploymentInsurance: 0,
      companyIndustrialAccident: 0,
      severancePay: 0,
      totalCompanyBurden: 0,
    };
    for (const row of rows) {
      const b = computeCompanyBurden(row);
      byRow.set(row.id, b);
      for (const k of Object.keys(total) as (keyof CompanyBurdenData)[]) {
        total[k] += b[k];
      }
    }
    return { byRow, sum: rows.length ? total : null };
  }, [rows]);

  return (
    <table className="w-full min-w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={showBasicDetail ? 2 : 1}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap"
          >
            <button
              type="button"
              onClick={() => setShowBasicDetail((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              기본 정보
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showBasicDetail ? "rotate-90" : "-rotate-90"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
              <span className="text-[10px] font-normal text-gray-400">
                {showBasicDetail ? "접기" : "펼치기"}
              </span>
            </button>
          </th>
          <th
            colSpan={showEmployeeDetail ? 4 : 1}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap"
          >
            <button
              type="button"
              onClick={() => setShowEmployeeDetail((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              직원 정보
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showEmployeeDetail ? "rotate-90" : "-rotate-90"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
              <span className="text-[10px] font-normal text-gray-400">
                {showEmployeeDetail ? "접기" : "펼치기"}
              </span>
            </button>
          </th>
          <th
            colSpan={showPaymentDetail ? visiblePaymentCount : 1}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600 whitespace-nowrap"
          >
            <button
              type="button"
              onClick={() => setShowPaymentDetail((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-blue-800 transition-colors"
            >
              지급 항목
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showPaymentDetail ? "rotate-90" : "-rotate-90"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
              <span className="text-[10px] font-normal text-blue-400">
                {showPaymentDetail ? "접기" : "펼치기"}
              </span>
            </button>
          </th>
          <th
            colSpan={showDeductionDetail ? visibleDeductionCount : 1}
            className="border-l border-gray-100 bg-rose-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-rose-500 whitespace-nowrap"
          >
            <button
              type="button"
              onClick={() => setShowDeductionDetail((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-rose-700 transition-colors"
            >
              공제 항목
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showDeductionDetail ? "rotate-90" : "-rotate-90 "}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
              <span className="text-[10px] font-normal text-rose-400">
                {showDeductionDetail ? "접기" : "펼치기"}
              </span>
            </button>
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-emerald-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-emerald-600"
          >
            실수령액
          </th>
          <th
            colSpan={
              showCompanyBurdenDetail ? COMPANY_BURDEN_COLS.length + 1 : 1
            }
            className="border-l border-gray-100 bg-orange-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-orange-600 whitespace-nowrap"
          >
            <button
              type="button"
              onClick={() => setShowCompanyBurdenDetail((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-orange-800 transition-colors"
            >
              회사 부담액
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showCompanyBurdenDetail ? "rotate-90" : "-rotate-90"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
              <span className="text-[10px] font-normal text-orange-400">
                {showCompanyBurdenDetail ? "접기" : "펼치기"}
              </span>
            </button>
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-purple-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-purple-600"
          >
            총 인건비
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-indigo-50 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-indigo-600"
          >
            발송
          </th>
        </tr>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            귀속년월
          </th>
          {/* <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급년월
          </th> */}
          {showBasicDetail && (
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
              지급일
            </th>
          )}
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            사원명
          </th>
          {showEmployeeDetail && (
            <>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                사원코드
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                부서
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                직급
              </th>
            </>
          )}
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-blue-600">
            지급액 합계
          </th>
          {showPaymentDetail &&
            PAYMENT_COLS.filter((c) => show(c.key)).map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600"
              >
                {col.label}
              </th>
            ))}
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-rose-500">
            공제액 합계
          </th>
          {showDeductionDetail &&
            DEDUCTION_COLS.filter((c) => show(c.key)).map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600"
              >
                {col.label}
              </th>
            ))}

          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-orange-600">
            부담액 합계
          </th>
          {showCompanyBurdenDetail &&
            COMPANY_BURDEN_COLS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600"
              >
                {col.label}
              </th>
            ))}
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-purple-600">
            총 인건비
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-center text-xs font-semibold text-indigo-600">
            발송 상태
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={21} />
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              } ${onRowClick ? "cursor-pointer" : ""}`}
            >
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.accrualYm)}
                </span>
              </td>
              {/* <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.paymentYm)}
                </span>
              </td> */}
              {showBasicDetail && (
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {new Date(row.payDate).toLocaleDateString("ko-KR")}
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              {showEmployeeDetail && (
                <>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                    {row.employeeCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {row.department ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {row.position && row.position !== "직급없음" ? (
                      row.position
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </>
              )}
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.totalPayment)}
              </td>
              {showPaymentDetail &&
                PAYMENT_COLS.filter((c) => show(c.key)).map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700"
                  >
                    {formatNumber(row[col.key])}
                  </td>
                ))}
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-rose-600">
                {formatNumber(row.totalDeduction)}
              </td>
              {showDeductionDetail &&
                DEDUCTION_COLS.filter((c) => show(c.key)).map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500"
                  >
                    {formatNumber(row[col.key])}
                  </td>
                ))}

              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPayment)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-orange-600">
                {formatNumber(
                  companyBurden.byRow.get(row.id)?.totalCompanyBurden ?? 0,
                )}
              </td>
              {showCompanyBurdenDetail &&
                COMPANY_BURDEN_COLS.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500"
                  >
                    {formatNumber(
                      companyBurden.byRow.get(row.id)?.[col.key] ?? 0,
                    )}
                  </td>
                ))}
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-purple-700">
                {formatNumber(
                  Number(row.totalPayment) +
                    (companyBurden.byRow.get(row.id)?.totalCompanyBurden ?? 0),
                )}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-center">
                {row.lastSentAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-green-200">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    {new Date(row.lastSentAt).toLocaleString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={(showBasicDetail ? 2 : 1) + (showEmployeeDetail ? 4 : 1)}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.totalPayment)}
            </td>
            {showPaymentDetail &&
              PAYMENT_COLS.filter((c) => show(c.key)).map((col) => (
                <td
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700"
                >
                  {formatNumber(sum[col.key])}
                </td>
              ))}
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-rose-600">
              {formatNumber(sum.totalDeduction)}
            </td>
            {showDeductionDetail &&
              DEDUCTION_COLS.filter((c) => show(c.key)).map((col) => (
                <td
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600"
                >
                  {formatNumber(sum[col.key])}
                </td>
              ))}

            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPayment)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-orange-600">
              {formatNumber(companyBurden.sum?.totalCompanyBurden ?? 0)}
            </td>
            {showCompanyBurdenDetail &&
              COMPANY_BURDEN_COLS.map((col) => (
                <td
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600"
                >
                  {formatNumber(companyBurden.sum?.[col.key] ?? 0)}
                </td>
              ))}
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-purple-700">
              {formatNumber(
                sum.totalPayment + (companyBurden.sum?.totalCompanyBurden ?? 0),
              )}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3" />
          </tr>
        </tfoot>
      )}
    </table>
  );
}
