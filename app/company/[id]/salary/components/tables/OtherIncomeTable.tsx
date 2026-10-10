import { useMemo } from "react";
import { EmptyRow } from "../EmptyRow";
import type { OtherIncomeRow } from "@/types/company/salary";

interface OtherIncomeTableProps {
  rows: OtherIncomeRow[];
  formatYm: (ym: number) => string;
  formatNumber: (v: string | number) => string;
  onRowClick?: (row: OtherIncomeRow) => void;
}

export function OtherIncomeTable({
  rows,
  formatYm,
  formatNumber,
  onRowClick,
}: OtherIncomeTableProps) {
  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      grossPayment: rows.reduce((s, r) => s + Number(r.grossPayment), 0),
      taxCorpTax: rows.reduce((s, r) => s + Number(r.taxCorpTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      netPayment: rows.reduce((s, r) => s + Number(r.netPayment), 0),
    };
  }, [rows]);

  return (
    <table className="w-full min-w-200 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={5}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급
          </th>
          <th
            colSpan={2}
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
            코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            성명
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            소득구분
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-blue-600">
            지급액
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세/법인세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={9} />
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
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  {row.incomeType}
                </span>
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.grossPayment)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.taxCorpTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
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
              colSpan={5}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.grossPayment)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.taxCorpTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
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
