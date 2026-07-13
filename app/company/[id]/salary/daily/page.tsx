"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import YearMonthPicker from "../components/filters/YearMonthPicker";
import { INCOME_META } from "../constants";
import { BulkPayslipDownload } from "../components/BulkPayslipDownload";
import { PayslipModal } from "../components/PayslipModal";
import { SummaryCardsRow } from "../components/SummaryCardsRow";
import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";
import {
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "../components/icons";
import { DailyIncomeLaborTable } from "../components/tables/DailyIncomeLaborTable";
import { useSalaryData } from "../hooks/useSalaryData";
import { formatBusinessNumber, formatNumber } from "../lib/format";
import { buildPageNumbers, shiftYm } from "../lib/navigation";
import { buildDailySummary } from "../lib/summary";
import type { DailyIncomeLaborRow } from "../types";

function SalaryDailyPageInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? "1");
  const filterAccrualYm = searchParams.get("accrualYm") ?? "";
  const filterPaymentYm = searchParams.get("paymentYm") ?? "";

  const [accrualInput, setAccrualInput] = useState(filterAccrualYm);
  const [paymentInput, setPaymentInput] = useState(filterPaymentYm);

  const [payslipRow, setPayslipRow] = useState<DailyIncomeLaborRow | null>(
    null,
  );

  const { dailyData, loading, error } = useSalaryData({
    companyId: id,
    currentPage,
    filterAccrualYm,
    filterPaymentYm,
    viewMode: "daily",
  });

  const data = dailyData;
  const company = dailyData?.company ?? null;
  const isAgentView = dailyData?.publication?.isAgentView ?? false;
  const totalPages = data ? Math.ceil(data.total / data.size) : 0;
  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const dailySummary = useMemo(() => buildDailySummary(dailyData), [dailyData]);

  const toCurrency = (value: number) => `₩ ${formatNumber(value)}`;

  function pushWithQuery(path: string, next: URLSearchParams) {
    const query = next.toString();
    router.push(query ? `${path}?${query}` : path);
  }

  function navigate(overrides: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!overrides.page) next.set("page", "1");
    pushWithQuery(pathname, next);
  }

  function goToDashboard() {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", "1");
    pushWithQuery(`/company/${id}/salary/dashboard`, next);
  }

  function navigateMonth(delta: number) {
    const nextAccrual = shiftYm(accrualInput || filterAccrualYm, delta);
    const nextPayment = shiftYm(paymentInput || filterPaymentYm, delta);
    setAccrualInput(nextAccrual);
    setPaymentInput(nextPayment);
    navigate({ accrualYm: nextAccrual, paymentYm: nextPayment });
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-450 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <IconBuilding />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                급여 명세
              </h1>
              {company && (
                <p className="text-sm text-gray-500">
                  {company.businessName ?? "이름 없음"}
                  <span className="mx-1.5 text-gray-300">•</span>
                  <span className="font-mono text-xs text-gray-400">
                    {formatBusinessNumber(company.businessNumber)}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* 귀속년월, 지급년월 선택 */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              title="이전월"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
            >
              <IconChevronLeft />
            </button>

            <YearMonthPicker
              label="귀속년월"
              placeholder="선택하세요"
              value={accrualInput}
              onChange={(v) => {
                setAccrualInput(v);
                setPaymentInput(v);
              }}
            />
            <YearMonthPicker
              label="지급년월"
              placeholder="선택하세요"
              value={paymentInput}
              onChange={setPaymentInput}
            />

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              title="다음월"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
            >
              <IconChevronRight />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate({
                  accrualYm: accrualInput,
                  paymentYm: paymentInput,
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98]"
            >
              <IconSearch />
              조회
            </button>

            {isAgentView && (
              <Link
                href={`/agent/company/${id}/salary/upload`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-[0.98]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                급여 입력
              </Link>
            )}
          </div>
        </div>

        {/* Tab label & bulk download */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToDashboard}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-900 active:scale-95"
            >
              <IconChevronLeft />
              대시보드로 돌아가기
            </button>
            <div
              className={`flex items-center gap-2 rounded-lg bg-linear-to-r ${INCOME_META.daily.gradient} px-4 py-1.5 text-sm font-semibold text-white shadow-sm`}
            >
              {INCOME_META.daily.label}
            </div>
          </div>
          {data && !loading && data.total > 0 && (
            <BulkPayslipDownload
              companyId={id}
              incomeType="daily"
              company={company}
              totalCount={data.total}
              accrualYm={filterAccrualYm || undefined}
              paymentYm={filterPaymentYm || undefined}
            />
          )}
        </div>

        {/* Summary cards */}
        {dailySummary && (
          <SummaryCardsRow summary={dailySummary} toCurrency={toCurrency} />
        )}

        {/* Table */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
          {data && !loading && (
            <div className="flex items-center justify-end border-b border-gray-100 px-6 py-3">
              <p className="text-sm text-gray-500">
                총{" "}
                <span className="font-semibold text-gray-800">
                  {data.total.toLocaleString()}
                </span>
                건
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-400">
                    (페이지 {currentPage} / {totalPages})
                  </span>
                )}
              </p>
            </div>
          )}

          {loading && <LoadingPanel />}
          {error && <ErrorPanel message={error} />}

          {!loading && !error && data && (
            <>
              <div className="max-h-[calc(100vh-20rem)] overflow-auto">
                <DailyIncomeLaborTable
                  rows={dailyData?.rows ?? []}
                  formatNumber={formatNumber}
                  onRowClick={(row) => setPayslipRow(row)}
                />
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                  <p className="text-xs text-gray-400">
                    {(currentPage - 1) * (data.size ?? 50) + 1}–
                    {Math.min(currentPage * (data.size ?? 50), data.total ?? 0)}
                    건 표시 중
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() =>
                        navigate({ page: String(currentPage - 1) })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <IconChevronLeft />
                    </button>
                    {pageNumbers.map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`dots-${i}`}
                          className="flex h-8 w-8 items-center justify-center text-xs text-gray-400"
                        >
                          ···
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => navigate({ page: String(p) })}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                            currentPage === p
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        navigate({ page: String(currentPage + 1) })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payslip modal */}
      {payslipRow && (
        <PayslipModal
          row={payslipRow}
          incomeType="daily"
          company={company}
          onClose={() => setPayslipRow(null)}
        />
      )}
    </div>
  );
}

export default function SalaryDailyPage() {
  return (
    <Suspense>
      <SalaryDailyPageInner />
    </Suspense>
  );
}
