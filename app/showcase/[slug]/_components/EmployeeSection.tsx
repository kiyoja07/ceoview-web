import { formatCurrency } from "./showcase-utils";
import type { ShowcaseScenario } from "./showcase-utils";
import { SectionLabel, StaticFieldList } from "./ShowcaseUI";

export default function EmployeeSection({
  scenario,
}: {
  scenario: ShowcaseScenario;
}) {
  return (
    <section id="employee" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          직원 포털
        </h2>
      </div>
      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">직원 포털</p>
                <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                  {scenario.employee.employeeName}님
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {scenario.employee.companyName}
                  {[
                    scenario.employee.department,
                    ` · ${scenario.employee.position}`,
                  ]}
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-linear-to-br from-blue-600 to-blue-700 p-6 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-200">최근 급여</p>
                  <p className="mt-1 text-lg font-semibold">
                    {scenario.employee.recentSummary.monthLabel} ·{" "}
                    {scenario.employee.recentSummary.incomeLabel}
                  </p>
                </div>
                <a
                  href="#payslip"
                  className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
                >
                  상세보기
                </a>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-medium text-blue-200">지급액</p>
                  <p className="mt-1 text-lg font-bold">
                    {formatCurrency(
                      scenario.employee.recentSummary.totalPayment,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-medium text-blue-200">공제액</p>
                  <p className="mt-1 text-lg font-bold">
                    {formatCurrency(
                      scenario.employee.recentSummary.totalDeduction,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-medium text-blue-200">실수령액</p>
                  <p className="mt-1 text-lg font-bold">
                    {formatCurrency(scenario.employee.recentSummary.netPayment)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  월별 급여명세서
                </h2>
                <a
                  href="#payslip"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  전체보기 →
                </a>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-500">
                    최근 명세서
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {scenario.employee.monthlyPayslips.map((entry) => (
                      <a
                        key={`${entry.monthLabel}:${entry.metaLabel}`}
                        href="#payslip"
                        className="group flex flex-col justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-md"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                            {entry.incomeLabel}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {entry.metaLabel}
                          </p>
                        </div>
                        <p className="mt-3 text-base font-bold text-blue-700">
                          {formatCurrency(entry.netPayment)}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <h2 className="text-lg font-semibold text-gray-900">내 정보</h2>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
                <StaticFieldList items={scenario.employee.profileFields} />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <h2 className="text-lg font-semibold text-gray-900">급여 계좌</h2>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
                <StaticFieldList items={scenario.employee.bankFields} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </section>
  );
}
