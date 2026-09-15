"use client";

import Link from "next/link";
import { useState } from "react";
import type { PivotTable } from "./types";

export function PivotTableCard({
  title,
  table,
  subLabelHeader,
  itemHeader,
  maxRows,
  viewAllHref,
  defaultCollapsed,
}: {
  title: string;
  table: PivotTable;
  subLabelHeader?: string;
  itemHeader: string;
  maxRows?: number;
  viewAllHref?: string;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);
  const hasSubLabel = table.rows.some((r) => r.subLabel);
  const truncated = maxRows != null && table.rows.length > maxRows;
  const visibleRows = truncated ? table.rows.slice(0, maxRows) : table.rows;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex min-w-0 items-center gap-2 text-left"
          aria-expanded={!collapsed}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="truncate text-base font-bold text-gray-900">
            {title}
          </h3>
        </button>
        {!collapsed && truncated && viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-xs font-medium text-blue-600 transition hover:text-blue-700"
          >
            전체 보기 (총 {table.rows.length.toLocaleString()}건) →
          </Link>
        )}
      </div>
      {collapsed ? null : table.rows.length === 0 ? (
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
      {!collapsed && truncated && (
        <p className="mt-3 text-xs text-gray-400">
          상위 {maxRows}건만 표시됩니다. 합계는 전체{" "}
          {table.rows.length.toLocaleString()}건 기준입니다.
        </p>
      )}
    </div>
  );
}
