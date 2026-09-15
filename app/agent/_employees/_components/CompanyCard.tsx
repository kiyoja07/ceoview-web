"use client";

import Link from "next/link";
import type { CompanyRow, IncomeTypeEmployeeStatus } from "./types";
import { formatBusinessNumber } from "./helpers";

function IconChevronRight() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5.25 15 12l-6 6.75"
      />
    </svg>
  );
}

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

export function CompanyCard({ company }: { company: CompanyRow }) {
  const statusColor = company.hasEmployees
    ? company.isFullyPublished
      ? "border-l-emerald-500"
      : company.hasUnpublished
        ? "border-l-amber-400"
        : "border-l-blue-400"
    : "border-l-gray-200";

  return (
    <Link
      href={`/agent/company/${company.id}/employees`}
      className={`block overflow-hidden rounded-xl border-l-4 bg-white shadow-sm ring-1 ring-gray-950/5 transition-all hover:-translate-y-0.5 hover:shadow-md ${statusColor}`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
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

          <div className="mt-3 flex flex-wrap gap-1.5 sm:hidden">
            {company.incomeTypes.map((it) => (
              <IncomeTypeBadge key={it.type} item={it} />
            ))}
          </div>
        </div>

        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {company.incomeTypes.map((it) => (
            <IncomeTypeBadge key={it.type} item={it} />
          ))}
        </div>

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

        <IconChevronRight />
      </div>
    </Link>
  );
}
