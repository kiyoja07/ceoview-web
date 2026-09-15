import type { Company } from "@/types/agent/employee";
import { formatBusinessNumber } from "../utils";

export function FixedCompanyDisplay({
  companiesLoading,
  fixedCompanyError,
  selectedCompany,
}: {
  companiesLoading: boolean;
  fixedCompanyError: string | null;
  selectedCompany: Company | undefined;
}) {
  if (companiesLoading) {
    return (
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
        사업자 확인 중…
      </div>
    );
  }

  if (fixedCompanyError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {fixedCompanyError}
      </div>
    );
  }

  if (!selectedCompany) return null;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        사업자
      </label>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700">
        {formatBusinessNumber(selectedCompany.businessNumber)}
        {selectedCompany.businessName
          ? ` / ${selectedCompany.businessName}`
          : ""}
      </div>
    </div>
  );
}
