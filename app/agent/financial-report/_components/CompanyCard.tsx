"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompanyRow } from "./types";
import { formatBusinessNumber, formatDate, relativeTime, won } from "./helpers";
import { IconCheck, IconUpload, IconEye, IconList } from "./icons";

/* ────────────── Status Pill ────────────── */

function StatusPill({ company }: { company: CompanyRow }) {
  if (company.reportCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
        미등록
      </span>
    );
  }

  if (company.isPublished) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
        <IconCheck />
        게시됨
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
      미게시
    </span>
  );
}

/* ────────────── Company Card ────────────── */

export function CompanyCard({ company }: { company: CompanyRow }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = company.isPublished
    ? "border-l-emerald-500"
    : company.reportCount > 0
      ? "border-l-amber-400"
      : "border-l-gray-200";

  const latest = company.latestReport;
  const active = company.activeReport;

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

        {/* Latest report summary */}
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <StatusPill company={company} />
          {latest && (
            <span className="text-xs text-gray-400">
              {latest.period
                ? latest.period
                : latest.fiscalYear
                  ? `${latest.fiscalYear}년`
                  : ""}{" "}
              · {latest.entryCount.toLocaleString()}건
            </span>
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
          {/* Mobile status */}
          <div className="mb-3 flex items-center gap-2 sm:hidden">
            <StatusPill company={company} />
          </div>

          {company.reportCount === 0 ? (
            <p className="text-xs text-gray-400">
              아직 생성된 재무리포트가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                      구분
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                      기간
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                      건수
                    </th>
                    <th className="pb-2 pr-4 text-left font-medium text-gray-500">
                      차변 / 대변
                    </th>
                    <th className="pb-2 text-left font-medium text-gray-500">
                      업로드
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {latest && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-gray-700">
                        최근 저장
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {latest.period ??
                          (latest.fiscalYear
                            ? `${latest.fiscalYear}년`
                            : "-")}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {latest.entryCount.toLocaleString()}건
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {won(latest.debitTotal)} / {won(latest.creditTotal)}
                      </td>
                      <td className="py-2 text-gray-500">
                        <span title={formatDate(latest.uploadedAt)}>
                          {relativeTime(latest.uploadedAt)}
                        </span>
                      </td>
                    </tr>
                  )}
                  {active && (
                    <tr>
                      <td className="py-2 pr-4 font-medium text-emerald-700">
                        게시본
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {active.period ??
                          (active.fiscalYear ? `${active.fiscalYear}년` : "-")}
                      </td>
                      <td className="py-2 pr-4 text-gray-300">-</td>
                      <td className="py-2 pr-4 text-gray-300">-</td>
                      <td className="py-2 text-gray-500">
                        <span title={formatDate(active.uploadedAt)}>
                          {relativeTime(active.uploadedAt)}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/agent/company/${company.id}/financial-report`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
            >
              <IconUpload />
              리포트 관리
            </Link>
            {latest && (
              <Link
                href={`/agent/company/${company.id}/financial-report/entries?reportId=${latest.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.97]"
              >
                <IconList />
                거래 내역
              </Link>
            )}
            {active && (
              <a
                href={`/company/${company.id}/financial-report?reportId=${active.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-[0.97]"
              >
                <IconEye />
                게시본 보기
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
