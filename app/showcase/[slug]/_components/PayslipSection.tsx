import EmployeePayslipViewer from "@/app/employee/payslips/_components/EmployeePayslipViewer";
import { formatCurrency } from "./showcase-utils";
import type { ShowcaseScenario } from "./showcase-utils";
import { SectionLabel } from "./ShowcaseUI";

export default function PayslipSection({
  scenario,
}: {
  scenario: ShowcaseScenario;
}) {
  return (
    <section id="payslip" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          직원 급여 명세서
        </h2>
      </div>
      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <a
                    href="#employee"
                    className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
                  >
                    직원 포털 홈으로
                  </a>
                  <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                    월별 급여명세서
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    현재 공개된 업로드 기준으로 본인 명세서만 확인할 수
                    있습니다.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      직원
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {scenario.employee.employeeName}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      회사
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {scenario.employee.companyName}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      급여 명세서
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {scenario.employee.monthlyPayslips.length}건
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                  <h2 className="text-lg font-semibold text-gray-900">
                    월별 목록
                  </h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        최근
                      </p>
                      <div className="mt-2 space-y-2">
                        {scenario.employee.monthlyPayslips.map(
                          (entry, index) => (
                            <div
                              key={`${entry.monthLabel}:${entry.metaLabel}`}
                              className={`block rounded-2xl border px-4 py-3 transition ${
                                index === 0
                                  ? "border-blue-500 bg-blue-50 shadow-sm"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {entry.incomeLabel}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {entry.metaLabel}
                              </p>
                              <p className="mt-2 text-sm font-medium text-blue-700">
                                실수령액 {formatCurrency(entry.netPayment)}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </aside>

              <div className="space-y-4">
                <section className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">지급액</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(
                        scenario.employee.recentSummary.totalPayment,
                      )}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">공제액</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(
                        scenario.employee.recentSummary.totalDeduction,
                      )}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">실수령액</p>
                    <p className="mt-2 text-xl font-semibold text-blue-700">
                      {formatCurrency(
                        scenario.employee.recentSummary.netPayment,
                      )}
                    </p>
                  </div>
                </section>

                <EmployeePayslipViewer
                  payslipData={scenario.employee.payslipData}
                  incomeLabel={scenario.employee.payslipIncomeLabel}
                  metaLabel={scenario.employee.payslipMetaLabel}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
