import Link from "next/link";
import { formatCurrencyKRW } from "@/app/lib/formatters";
import EmployeePayslipViewer from "@/app/employee/payslips/_components/EmployeePayslipViewer";
import { getEmployeePayslipCollection } from "@/app/lib/employee-payslips";
import { getEmployeePortalSession } from "@/app/lib/employee-portal";

export const dynamic = "force-dynamic";

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmployeePayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    type?: string | string[];
    id?: string | string[];
  }>;
}) {
  const session = await getEmployeePortalSession();
  const params = await searchParams;
  const collection = await getEmployeePayslipCollection(session);
  const selectedMonth = getSearchValue(params.month);
  const selectedType = getSearchValue(params.type);
  const selectedId = getSearchValue(params.id);

  const selectedEntry =
    collection.allEntries.find((entry) => {
      const monthKey = entry.monthKey ?? "none";
      return (
        monthKey === selectedMonth &&
        entry.type === selectedType &&
        entry.id === selectedId
      );
    }) ?? collection.allEntries[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/employee"
                className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
              >
                직원 포털 홈으로
              </Link>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                월별 급여명세서
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                현재 공개된 업로드 기준으로 본인 명세서만 확인할 수 있습니다.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  직원
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {session.name}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  회사
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {session.employee.company.businessName ?? "회사"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  공개 명세서
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {collection.allEntries.length}건
                </p>
              </div>
            </div>
          </div>
        </section>

        {collection.allEntries.length === 0 ? (
          <section className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <h2 className="text-xl font-semibold text-gray-900">
              확인 가능한 급여명세서가 없습니다
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              현재 공개된 급여 데이터에 본인 명세서가 연결되어 있지 않습니다.
              회사 담당자에게 문의해 주세요.
            </p>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                <h2 className="text-lg font-semibold text-gray-900">
                  월별 목록
                </h2>
                <div className="mt-4 space-y-4">
                  {collection.monthGroups.map((group) => (
                    <div key={group.monthKey}>
                      <p className="text-sm font-semibold text-gray-900">
                        {group.monthLabel}
                      </p>
                      <div className="mt-2 space-y-2">
                        {group.entries.map((entry) => {
                          const active =
                            selectedEntry?.id === entry.id &&
                            selectedEntry.type === entry.type;
                          return (
                            <Link
                              key={`${entry.type}:${entry.id}`}
                              href={{
                                pathname: "/employee/payslips",
                                query: {
                                  month: entry.monthKey ?? "none",
                                  type: entry.type,
                                  id: entry.id,
                                },
                              }}
                              className={`block rounded-2xl border px-4 py-3 transition ${
                                active
                                  ? "border-blue-500 bg-blue-50 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {entry.incomeLabel}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {entry.metaLabel}
                              </p>
                              <p className="mt-2 text-sm font-medium text-blue-700">
                                실수령액 {formatCurrencyKRW(entry.netPayment)}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {collection.undatedEntries.length > 0 && (
                <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                  <h2 className="text-lg font-semibold text-gray-900">
                    월 정보 없음
                  </h2>
                  <div className="mt-4 space-y-2">
                    {collection.undatedEntries.map((entry) => {
                      const active =
                        selectedEntry?.id === entry.id &&
                        selectedEntry.type === entry.type;
                      return (
                        <Link
                          key={`${entry.type}:${entry.id}`}
                          href={{
                            pathname: "/employee/payslips",
                            query: {
                              month: "none",
                              type: entry.type,
                              id: entry.id,
                            },
                          }}
                          className={`block rounded-2xl border px-4 py-3 transition ${
                            active
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.incomeLabel}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {entry.metaLabel}
                          </p>
                          <p className="mt-2 text-sm font-medium text-blue-700">
                            실수령액 {formatCurrencyKRW(entry.netPayment)}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </aside>

            <div className="space-y-4">
              {selectedEntry && (
                <>
                  <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                      <p className="text-sm text-gray-500">지급액</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrencyKRW(selectedEntry.totalPayment)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                      <p className="text-sm text-gray-500">공제액</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {formatCurrencyKRW(selectedEntry.totalDeduction)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                      <p className="text-sm text-gray-500">실수령액</p>
                      <p className="mt-2 text-xl font-semibold text-blue-700">
                        {formatCurrencyKRW(selectedEntry.netPayment)}
                      </p>
                    </div>
                  </section>

                  <EmployeePayslipViewer
                    payslipData={selectedEntry.payslipData}
                    incomeLabel={selectedEntry.incomeLabel}
                    metaLabel={selectedEntry.metaLabel}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
