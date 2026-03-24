import {
  type CompanyEmployeeDashboardSummary,
  type EmployeeIncomeFilter,
} from "@/types/company/employees";
import { getIncomeTypeTone } from "@/app/company/_components/employees/utils";
import { EMPLOYEE_INCOME_TYPE_OPTIONS } from "@/catalogs/ko/employee";

type EmployeeSummaryCardsProps = {
  summary: CompanyEmployeeDashboardSummary | null;
  incomeTypeFilter: EmployeeIncomeFilter;
  onIncomeTypeFilter: (value: EmployeeIncomeFilter) => void;
};

export default function EmployeeSummaryCards({
  summary,
  incomeTypeFilter,
  onIncomeTypeFilter,
}: EmployeeSummaryCardsProps) {
  if (!summary) return null;

  const summaryByIncomeType = new Map(
    summary.byIncomeType.map((item) => [item.incomeType, item]),
  );

  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-5">
      <button
        type="button"
        onClick={() => onIncomeTypeFilter("ALL")}
        className={`rounded-2xl border p-4 text-left transition ${
          incomeTypeFilter === "ALL"
            ? "border-emerald-300 bg-emerald-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
            전체
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {`${summary.total.toLocaleString()}명`}
        </p>
      </button>

      {EMPLOYEE_INCOME_TYPE_OPTIONS.map((option) => {
        const item = summaryByIncomeType.get(option.value);
        const isActive = incomeTypeFilter === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onIncomeTypeFilter(option.value)}
            className={`rounded-2xl border p-4 text-left transition ${
              isActive
                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getIncomeTypeTone(option.value)}`}
              >
                {option.label}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {`${item?.total.toLocaleString() ?? 0}명`}
            </p>
          </button>
        );
      })}
    </div>
  );
}
