import Link from "next/link";
import type { PivotTable } from "./types";

export function PivotTableCard({
  title,
  table,
  subLabelHeader,
  itemHeader,
  maxRows,
  viewAllHref,
}: {
  title: string;
  table: PivotTable;
  subLabelHeader?: string;
  itemHeader: string;
  maxRows?: number;
  viewAllHref?: string;
}) {
  const hasSubLabel = table.rows.some((r) => r.subLabel);
  const truncated = maxRows != null && table.rows.length > maxRows;
  const visibleRows = truncated ? table.rows.slice(0, maxRows) : table.rows;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {truncated && viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-xs font-medium text-blue-600 transition hover:text-blue-700"
          >
            전체 보기 (총 {table.rows.length.toLocaleString()}건) →
          </Link>
        )}
      </div>
      {table.rows.length === 0 ? (
        <p className="text-sm text-gray-400">데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                {hasSubLabel && (
                  <th className="py-2 pr-3 font-medium">
                    {subLabelHeader ?? "계정용도"}
                  </th>
                )}
                <th className="py-2 pr-3 font-medium">{itemHeader}</th>
                <th className="py-2 pr-3 text-right font-semibold">합계</th>
                {table.months.map((m) => (
                  <th
                    key={m}
                    className="py-2 pr-3 text-right font-medium whitespace-nowrap"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr
                  key={`${row.subLabel ?? ""}-${row.label}-${i}`}
                  className="border-b border-gray-50 text-gray-700"
                >
                  {hasSubLabel && (
                    <td className="py-2 pr-3 text-gray-500">
                      {row.subLabel ?? "-"}
                    </td>
                  )}
                  <td className="py-2 pr-3 whitespace-nowrap">{row.label}</td>
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                    {row.total.toLocaleString()}
                  </td>
                  {table.months.map((m) => (
                    <td key={m} className="py-2 pr-3 text-right tabular-nums">
                      {row.monthly[m] ? row.monthly[m].toLocaleString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold text-gray-900">
                {hasSubLabel && <td className="py-2 pr-3" />}
                <td className="py-2 pr-3">합계</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {table.grandTotal.toLocaleString()}
                </td>
                {table.months.map((m) => (
                  <td key={m} className="py-2 pr-3 text-right tabular-nums">
                    {table.monthlyTotals[m]?.toLocaleString() ?? ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {truncated && (
        <p className="mt-3 text-xs text-gray-400">
          상위 {maxRows}건만 표시됩니다. 합계는 전체{" "}
          {table.rows.length.toLocaleString()}건 기준입니다.
        </p>
      )}
    </div>
  );
}
