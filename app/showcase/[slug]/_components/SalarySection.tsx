import {
  formatBusinessNumber,
  formatNumber,
} from "@/app/company/[id]/salary/lib/format";
import { SummaryCardsRow } from "@/app/company/[id]/salary/components/SummaryCardsRow";
import type {
  IncomeSummary,
  MonthlyStat,
} from "@/app/company/[id]/salary/types";
import ShowcaseMonthlyStatsChart from "./ShowcaseMonthlyStatsChart";
import { formatCurrency } from "./showcase-utils";
import type { ShowcaseScenario } from "./showcase-utils";
import { SectionLabel } from "./ShowcaseUI";

export default function SalarySection({
  scenario,
  salaryStats,
  salarySummary,
}: {
  scenario: ShowcaseScenario;
  salaryStats: MonthlyStat[];
  salarySummary: IncomeSummary;
}) {
  return (
    <section id="salary" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          회사 급여 지급 현황
        </h2>
      </div>
      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <div className="min-h-screen bg-app-bg">
          <div className="mx-auto max-w-350 p-6 lg:p-8">
            <div className="mb-8 rounded-3xl bg-linear-to-br from-blue-950 via-blue-900 to-indigo-800 px-6 py-7 text-white shadow-lg shadow-blue-200/60">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight">
                    인건비 지급 현황
                  </h1>
                  <p className="mt-2 text-sm text-blue-100/90">
                    {scenario.company.businessName}
                    <span className="mx-1.5 text-blue-300/50">•</span>
                    <span className="font-mono text-xs text-blue-200/70">
                      {formatBusinessNumber(
                        scenario.company.businessNumber.replace(/\D/g, ""),
                      )}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button className="shrink-0 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-gray-300">
                  전체
                </button>
                <button className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-200">
                  2026년
                </button>
                <button className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-200">
                  2025년
                </button>
              </div>
            </div>

            <SummaryCardsRow
              summary={salarySummary}
              toCurrency={(value) => formatNumber(value)}
            />

            <ShowcaseMonthlyStatsChart stats={salaryStats} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {scenario.company.salaryRows.map((row) => (
                <div
                  key={`${row.employeeName}:${row.incomeLabel}`}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5"
                >
                  <p className="text-sm font-medium text-gray-500">
                    {row.employeeName}
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {row.incomeLabel}
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>총 지급액</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(row.totalPayment)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>총 공제액</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(row.totalDeduction)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-gray-500">
                      <span>차인지급액</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(row.netPayment)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
