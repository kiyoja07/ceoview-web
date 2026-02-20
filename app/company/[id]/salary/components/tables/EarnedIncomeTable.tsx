import { useMemo } from "react";
import { EmptyRow } from "../EmptyRow";
import type { EarnedIncomeRow } from "../../types";

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

  return (
    <table className="w-full min-w-400 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={7}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={6}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급 항목
          </th>
          <th
            colSpan={7}
            className="border-l border-gray-100 bg-rose-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-rose-500"
          >
            공제 항목
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-emerald-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-emerald-600"
          >
            실수령
          </th>
        </tr>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            귀속년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급년월
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            지급일
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            사원코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            사원명
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            부서
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            직급
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            기본급
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            상여
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            식대
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            수당
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            출장비
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-blue-600">
            지급액계
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            국민연금
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            건강보험
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            고용보험
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            장기요양
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-rose-500">
            공제액계
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
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
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                  {formatYm(row.paymentYm)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                {new Date(row.payDate).toLocaleDateString("ko-KR")}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.department ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.position ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.baseSalary)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.bonus)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.mealAllowance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.allowance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {formatNumber(row.travelExpense)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.totalPayment)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.nationalPensionDeduction)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.healthInsurance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.employmentInsurance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.longTermCareInsurance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.incomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-rose-600">
                {formatNumber(row.totalDeduction)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPayment)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={7}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.baseSalary)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.bonus)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.mealAllowance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.allowance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.travelExpense)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.totalPayment)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.nationalPensionDeduction)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.healthInsurance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.employmentInsurance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.longTermCareInsurance)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.incomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-rose-600">
              {formatNumber(sum.totalDeduction)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPayment)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
