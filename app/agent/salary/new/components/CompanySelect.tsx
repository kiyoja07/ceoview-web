import Link from "next/link";
import type { CompanySelectProps } from "../types";
import { formatBusinessNumber } from "../utils";

export function CompanySelect({
  companiesLoading,
  companies,
  companyId,
  onChange,
}: CompanySelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        사업자 선택 <span className="text-red-500">*</span>
      </label>
      {companiesLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          로딩 중…
        </div>
      ) : companies.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          등록된 사업자가 없습니다.{" "}
          <Link
            href="/agent/company/new"
            className="font-medium text-amber-900 underline underline-offset-2"
          >
            먼저 사업자를 등록
          </Link>
          해주세요.
        </div>
      ) : (
        <select
          value={companyId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">-- 사업자를 선택하세요 --</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {formatBusinessNumber(company.businessNumber)}
              {company.businessName ? ` / ${company.businessName}` : ""}
              {company.businessType === "INDIVIDUAL"
                ? " / 개인사업자"
                : company.businessType === "CORPORATION"
                  ? " / 법인사업자"
                  : ""}
              {company.representativeName
                ? ` (${company.representativeName})`
                : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
