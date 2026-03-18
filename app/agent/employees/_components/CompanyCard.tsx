"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompanyRow, IncomeTypeEmployeeStatus } from "./types";
import { formatBusinessNumber } from "./helpers";
import { IconUpload, IconEye } from "./icons";

function IconPublish() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
      />
    </svg>
  );
}

/* ────────────── Income Type Badge ────────────── */

function IncomeTypeBadge({ item }: { item: IncomeTypeEmployeeStatus }) {
  if (item.totalCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
        {item.label}
      </span>
    );
  }

  const isFullyPublished = item.savedCount === 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
        isFullyPublished
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          : "bg-amber-50 text-amber-700 ring-amber-600/20"
      }`}
    >
      {item.label}
      <span
        className={`text-[10px] ${
          isFullyPublished ? "text-emerald-500" : "text-amber-500"
        }`}
      >
        {item.totalCount}
      </span>
      {!isFullyPublished && (
        <span className="text-[10px] text-amber-500">
          ·미발행{item.savedCount}
        </span>
      )}
    </span>
  );
}

/* ────────────── Company Card ────────────── */

export function CompanyCard({ company }: { company: CompanyRow }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = company.hasEmployees
    ? company.isFullyPublished
      ? "border-l-emerald-500"
      : company.hasUnpublished
        ? "border-l-amber-400"
        : "border-l-blue-400"
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

        {/* Income type badges */}
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {company.incomeTypes.map((it) => (
            <IncomeTypeBadge key={it.type} item={it} />
          ))}
        </div>

        {/* Employee count */}
        <div className="hidden w-28 flex-col items-end gap-0.5 lg:flex">
          <span className="text-sm font-semibold text-gray-900">
            {company.totalCount}
            <span className="ml-0.5 text-xs font-normal text-gray-400">명</span>
          </span>
          {company.hasEmployees && (
            <>
              <span className="text-[11px] text-gray-400">
                재직 {company.activeCount} · 퇴직 {company.resignedCount}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  company.isFullyPublished
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {company.isFullyPublished
                  ? "발행완료"
                  : `미발행 ${company.savedCount}명`}
              </span>
            </>
          )}
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
          {/* Mobile badges */}
          <div className="mb-3 flex flex-wrap gap-1.5 sm:hidden">
            {company.incomeTypes.map((it) => (
              <IncomeTypeBadge key={it.type} item={it} />
            ))}
          </div>

          {/* Mobile count */}
          <div className="mb-3 lg:hidden">
            <span className="text-sm font-semibold text-gray-900">
              총 {company.totalCount}명
            </span>
            {company.hasEmployees && (
              <span className="ml-2 text-xs text-gray-400">
                재직 {company.activeCount} · 퇴직 {company.resignedCount}
              </span>
            )}
          </div>

          {/* Detail table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                    소득유형
                  </th>
                  <th className="pb-2 pr-4 text-right font-medium text-gray-500">
                    전체
                  </th>
                  <th className="pb-2 pr-4 text-right font-medium text-gray-500">
                    발행
                  </th>
                  <th className="pb-2 pr-4 text-right font-medium text-gray-500">
                    미발행
                  </th>
                  <th className="pb-2 pr-4 text-right font-medium text-gray-500">
                    재직
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-500">
                    퇴직
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {company.incomeTypes.map((it) => (
                  <tr key={it.type}>
                    <td className="py-2 pr-4 font-medium text-gray-700">
                      {it.label}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-900">
                      {it.totalCount > 0 ? (
                        <span>{it.totalCount}명</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {it.publishedCount > 0 ? (
                        <span className="text-emerald-600">
                          {it.publishedCount}명
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {it.savedCount > 0 ? (
                        <span className="text-amber-600">
                          {it.savedCount}명
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {it.activeCount > 0 ? (
                        <span className="text-blue-600">
                          {it.activeCount}명
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {it.resignedCount > 0 ? (
                        <span className="text-gray-500">
                          {it.resignedCount}명
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="pt-2 pr-4 font-semibold text-gray-800">
                    합계
                  </td>
                  <td className="pt-2 pr-4 text-right font-semibold text-gray-900">
                    {company.totalCount}명
                  </td>
                  <td className="pt-2 pr-4 text-right font-semibold text-emerald-600">
                    {company.publishedCount}명
                  </td>
                  <td className="pt-2 pr-4 text-right font-semibold text-amber-600">
                    {company.savedCount}명
                  </td>
                  <td className="pt-2 pr-4 text-right font-semibold text-blue-600">
                    {company.activeCount}명
                  </td>
                  <td className="pt-2 text-right font-semibold text-gray-500">
                    {company.resignedCount}명
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/agent/employees/new?companyId=${company.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
            >
              <IconUpload />
              직원 등록
            </Link>
            <Link
              href={`/agent/company/${company.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.97]"
            >
              <IconEye />
              거래처 상세
            </Link>
            {company.hasEmployees && (
              <Link
                href={`/agent/company/${company.id}/employee-publication`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.97]"
              >
                <IconPublish />
                직원 발행 관리
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
