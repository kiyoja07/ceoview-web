import type { FixedCompanyDisplayProps } from "../types";
import { formatBusinessNumber } from "../utils";

export function FixedCompanyDisplay({
  companiesLoading,
  fixedCompanyError,
  selectedCompany,
}: FixedCompanyDisplayProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        등록 대상 사업자
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
      ) : fixedCompanyError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          {fixedCompanyError}
        </div>
      ) : selectedCompany ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          <svg
            className="h-4 w-4 shrink-0 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
            />
          </svg>
          {formatBusinessNumber(selectedCompany.businessNumber)}
          {selectedCompany.businessName
            ? ` / ${selectedCompany.businessName}`
            : ""}
          {selectedCompany.representativeName
            ? ` (대표 ${selectedCompany.representativeName})`
            : ""}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          사업자 정보를 확인하는 중입니다.
        </p>
      )}
    </div>
  );
}
