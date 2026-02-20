import { useMemo } from "react";
import { EmptyRow } from "../EmptyRow";
import type { DailyIncomeLaborRow } from "../../types";

interface DailyIncomeLaborTableProps {
  rows: DailyIncomeLaborRow[];
  formatNumber: (v: string | number) => string;
  onRowClick?: (row: DailyIncomeLaborRow) => void;
}

export function DailyIncomeLaborTable({
  rows,
  formatNumber,
  onRowClick,
}: DailyIncomeLaborTableProps) {
  const sum = useMemo(() => {
    if (!rows.length) return null;
    return {
      workDays: rows.reduce((s, r) => s + (r.workDays ?? 0), 0),
      normalHours: rows.reduce((s, r) => s + Number(r.normalHours ?? 0), 0),
      overtimeHours: rows.reduce((s, r) => s + Number(r.overtimeHours ?? 0), 0),
      grossPay: rows.reduce((s, r) => s + Number(r.grossPay), 0),
      employmentIns: rows.reduce((s, r) => s + Number(r.employmentIns), 0),
      nationalPension: rows.reduce((s, r) => s + Number(r.nationalPension), 0),
      healthIns: rows.reduce((s, r) => s + Number(r.healthIns), 0),
      incomeTax: rows.reduce((s, r) => s + Number(r.incomeTax), 0),
      localIncomeTax: rows.reduce((s, r) => s + Number(r.localIncomeTax), 0),
      longTermCare: rows.reduce((s, r) => s + Number(r.longTermCare), 0),
      netPay: rows.reduce((s, r) => s + Number(r.netPay), 0),
    };
  }, [rows]);

  return (
    <table className="w-full min-w-350 text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-100">
          <th
            colSpan={4}
            className="bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            기본 정보
          </th>
          <th
            colSpan={3}
            className="border-l border-gray-100 bg-indigo-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-indigo-600"
          >
            근무
          </th>
          <th
            colSpan={1}
            className="border-l border-gray-100 bg-blue-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-blue-600"
          >
            지급
          </th>
          <th
            colSpan={6}
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
            코드
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            성명
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            직종
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
            직급
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            근무일수
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            정상시간
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            연장시간
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-blue-600">
            급여총액
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-gray-600">
            고용보험료
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            국민연금
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            건강보험료
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
            지방소득세
          </th>
          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-rose-500">
            요양보험
          </th>
          <th className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right text-xs font-semibold text-emerald-600">
            차인지급액
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <EmptyRow colSpan={15} />
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              } ${onRowClick ? "cursor-pointer" : ""}`}
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                {row.employeeCode}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {row.employeeName}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.jobType ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                {row.position ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-700">
                {row.workDays ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {row.normalHours != null ? (
                  formatNumber(row.normalHours)
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                {row.overtimeHours != null ? (
                  formatNumber(row.overtimeHours)
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-semibold text-blue-700">
                {formatNumber(row.grossPay)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.employmentIns)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.nationalPension)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.healthIns)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.incomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.localIncomeTax)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-500">
                {formatNumber(row.longTermCare)}
              </td>
              <td className="whitespace-nowrap border-l border-gray-50 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                {formatNumber(row.netPay)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      {sum && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50/80">
            <td
              colSpan={4}
              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold text-gray-700"
            >
              합계
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.workDays)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.normalHours)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-700">
              {formatNumber(sum.overtimeHours)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-blue-700">
              {formatNumber(sum.grossPay)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.employmentIns)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.nationalPension)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.healthIns)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.incomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-gray-600">
              {formatNumber(sum.localIncomeTax)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-bold text-rose-600">
              {formatNumber(sum.longTermCare)}
            </td>
            <td className="whitespace-nowrap border-l border-gray-100 px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
              {formatNumber(sum.netPay)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
