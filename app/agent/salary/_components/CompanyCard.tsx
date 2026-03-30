"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompanyRow, IncomeTypeStatus } from "./types";
import { formatBusinessNumber, formatDate, relativeTime } from "./helpers";
import { IconCheck, IconUpload, IconEye } from "./icons";

/* ────────────── Income Type Pill ────────────── */

function IncomeTypePill({ item }: { item: IncomeTypeStatus }) {
  if (!item.hasUpload) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
        {item.label}
      </span>
    );
  }

  if (item.isPublished) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
        <IconCheck />
        {item.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
      {item.label}
    </span>
  );
}

/* ────────────── Company Card ────────────── */

export function CompanyCard({ company }: { company: CompanyRow }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = company.isFullyPublished
    ? "border-l-emerald-500"
    : company.uploadedTypeCount > 0
      ? "border-l-amber-400"
      : "border-l-gray-200";

  return (
    <div
      className={`overflow-hidden rounded-xl border-l-4 bg-white shadow-sm ring-1 ring-gray-950/5 transition-all ${statusColor}`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
      >
        {/* Business info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {company.businessName || "이름 없음"}
            </h3>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                company.businessType === "INDIVIDUAL"
                  ? "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
                  : "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20"
              }`}
            >
              {company.businessType === "INDIVIDUAL" ? "개인" : "법인"}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-gray-400">
            {formatBusinessNumber(company.businessNumber)}
            {company.representativeName && (
              <span className="ml-2 font-sans text-gray-400">
                {company.representativeName}
              </span>
            )}
          </p>
        </div>

        {/* Income type pills */}
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {company.incomeTypes.map((it) => (
            <IncomeTypePill key={it.type} item={it} />
          ))}
        </div>

        {/* Expand arrow */}
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {/* Mobile pills */}
          <div className="mb-3 flex flex-wrap gap-1.5 sm:hidden">
            {company.incomeTypes.map((it) => (
              <IncomeTypePill key={it.type} item={it} />
            ))}
          </div>

          {/* Detail table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                    소득유형
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                    상태
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                    최근 업로드
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                    발행일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {company.incomeTypes.map((it) => (
                  <tr key={it.type}>
                    <td className="py-2 pr-4 font-medium text-gray-700">
                      {it.label}
                    </td>
                    <td className="py-2 pr-4">
                      {!it.hasUpload ? (
                        <span className="text-gray-400">미등록</span>
                      ) : it.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <IconCheck />
                          발행완료
                        </span>
                      ) : (
                        <span className="text-amber-600">미발행</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {it.latestUpload ? (
                        <span title={formatDate(it.latestUpload.uploadedAt)}>
                          {relativeTime(it.latestUpload.uploadedAt)}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500">
                      {it.publishedAt ? (
                        <span title={formatDate(it.publishedAt)}>
                          {relativeTime(it.publishedAt)}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/agent/company/${company.id}/salary/upload`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
            >
              <IconUpload />
              급여 입력
            </Link>
            <Link
              href={`/agent/company/${company.id}/salary`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.97]"
            >
              <IconEye />
              발행 관리
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
