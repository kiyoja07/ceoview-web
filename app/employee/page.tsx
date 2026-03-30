import Link from "next/link";
import { formatCurrencyKRW } from "@/app/lib/formatters";
import EmployeeProfileEditor from "./_components/EmployeeProfileEditor";
import EmployeeBankAccountEditor from "./_components/EmployeeBankAccountEditor";
import { getEmployeePortalSession } from "@/app/lib/employee-portal";
import { getEmployeePayslipCollection } from "@/app/lib/employee-payslips";

export const dynamic = "force-dynamic";

export default async function EmployeeHomePage() {
  const user = await getEmployeePortalSession();
  const collection = await getEmployeePayslipCollection(user);
  const latestEntry = collection.allEntries[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 헤더: 인사 + 기본 정보 */}
        <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">직원 포털</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {user.name}님
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {user.employee.company.businessName ?? "회사"}
              {[
                user.employee.department,
                user.employee.positionTitle !== "직급없음"
                  ? ` · ${user.employee.positionTitle}`
                  : null,
              ]}
            </p>
          </div>
        </section>

        {/* 메인: 급여명세서 */}
        {collection.allEntries.length === 0 ? (
          <section className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-7 w-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              확인 가능한 급여명세서가 없습니다
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              현재 공개된 급여 데이터에 본인 명세서가 연결되어 있지 않습니다.
              <br />
              회사 담당자에게 문의해 주세요.
            </p>
          </section>
        ) : (
          <>
            {/* 최근 급여 요약 */}
            {latestEntry && (
              <section className="rounded-3xl bg-linear-to-br from-blue-600 to-blue-700 p-6 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-200">
                      최근 급여
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {latestEntry.monthLabel} · {latestEntry.incomeLabel}
                    </p>
                  </div>
                  <Link
                    href={{
                      pathname: "/employee/payslips",
                      query: {
                        month: latestEntry.monthKey ?? "none",
                        type: latestEntry.type,
                        id: latestEntry.id,
                      },
                    }}
                    className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
                  >
                    상세보기
                  </Link>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium text-blue-200">지급액</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrencyKRW(latestEntry.totalPayment)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium text-blue-200">공제액</p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrencyKRW(latestEntry.totalDeduction)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs font-medium text-blue-200">
                      실수령액
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrencyKRW(latestEntry.netPayment)}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 월별 명세서 목록 */}
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  월별 급여명세서
                </h2>
                <Link
                  href="/employee/payslips"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  전체보기 →
                </Link>
              </div>
              <div className="mt-5 space-y-5">
                {collection.monthGroups.map((group) => (
                  <div key={group.monthKey}>
                    <p className="mb-2 text-sm font-semibold text-gray-500">
                      {group.monthLabel}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.entries.map((entry) => (
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
                            {formatCurrencyKRW(entry.netPayment)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {collection.undatedEntries.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-500">
                      월 정보 없음
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {collection.undatedEntries.map((entry) => (
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
                            {formatCurrencyKRW(entry.netPayment)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* 내 정보 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="text-lg font-semibold text-gray-900">내 정보</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
            <EmployeeProfileEditor
              initial={{
                email: user.email ?? "",
                phone: user.phone ?? "",
                zipcode: user.zipcode ?? "",
                address: user.address ?? "",
                addressDetail: user.addressDetail ?? "",
              }}
            />
          </div>
        </section>

        {/* 급여 계좌 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="text-lg font-semibold text-gray-900">급여 계좌</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
            <EmployeeBankAccountEditor />
          </div>
        </section>
      </div>
    </main>
  );
}
