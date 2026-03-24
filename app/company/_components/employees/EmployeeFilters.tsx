import type {
  CompanyEmployeeDashboardSummary,
  EmployeeStatusFilter,
} from "@/types/company/employees";
import { EMPLOYEE_STATUS_FILTERS } from "@/catalogs/ko/employee";

type EmployeeFiltersProps = {
  summary: CompanyEmployeeDashboardSummary | null;
  searchInput: string;
  statusFilter: EmployeeStatusFilter;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onStatusFilter: (value: EmployeeStatusFilter) => void;
};

export default function EmployeeFilters({
  summary,
  searchInput,
  statusFilter,
  onSearchInputChange,
  onSearch,
  onStatusFilter,
}: EmployeeFiltersProps) {
  if (!summary) return null;

  return (
    <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
            placeholder="이름, 사원코드, 부서, 연락처 검색"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none sm:w-80"
          />
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            검색
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {EMPLOYEE_STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onStatusFilter(filter.value)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-white/20 text-white" : "bg-white text-gray-500"
                  }`}
                >
                  {filter.getCount(summary).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
