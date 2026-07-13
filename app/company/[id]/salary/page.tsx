"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import YearMonthPicker from "./components/filters/YearMonthPicker";
import { DashboardCard } from "./components/DashboardCard";
import { MonthlyStatsChart } from "./components/MonthlyStatsChart";
import { SummaryCardsRow } from "./components/SummaryCardsRow";
import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";
import {
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "./components/icons";
import { useSalaryData } from "./hooks/useSalaryData";
import { useSalaryStats } from "./hooks/useSalaryStats";
import { formatBusinessNumber, formatNumber } from "./lib/format";
import { shiftYm } from "./lib/navigation";
import {
  buildBusinessSummary,
  buildDailySummary,
  buildEarnedSummary,
  buildGrandTotal,
  buildOtherSummary,
} from "./lib/summary";
import type { IncomeTab } from "./types";

function SalaryPageInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filterAccrualYm = searchParams.get("accrualYm") ?? "";
  const filterPaymentYm = searchParams.get("paymentYm") ?? "";

  // 쿼리 파라미터가 없으면 현재 년월로 기본 설정
  useEffect(() => {
    const hasAccrual = searchParams.has("accrualYm");
    const hasPayment = searchParams.has("paymentYm");
    const hasPage = searchParams.has("page");

    if (!hasAccrual || !hasPayment || !hasPage) {
      const now = new Date();
      const currentYm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const next = new URLSearchParams(searchParams.toString());
      if (!hasPage) next.set("page", "1");
      if (!hasAccrual) next.set("accrualYm", currentYm);
      if (!hasPayment) next.set("paymentYm", currentYm);
      router.replace(`${pathname}?${next.toString()}`);
    }
  }, [searchParams, pathname, router]);

  const [accrualInput, setAccrualInput] = useState(filterAccrualYm);
  const [paymentInput, setPaymentInput] = useState(filterPaymentYm);

  // 쿼리 파라미터 변경 시 입력 상태 동기화
  useEffect(() => {
    setAccrualInput(filterAccrualYm);
  }, [filterAccrualYm]);
  useEffect(() => {
    setPaymentInput(filterPaymentYm);
  }, [filterPaymentYm]);

  const [statsMonths, setStatsMonths] = useState(12);

  const { earnedData, businessData, dailyData, otherData, loading, error } =
    useSalaryData({
      companyId: id,
      currentPage: 1,
      filterAccrualYm,
      filterPaymentYm,
      viewMode: "dashboard",
    });

  const { data: statsData, loading: statsLoading } = useSalaryStats({
    companyId: id,
    months: statsMonths,
    enabled: true,
  });

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

  function switchTab(tab: IncomeTab) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", "1");
    pushWithQuery(`/company/${id}/salary/${tab}`, next);
  }

  function navigateMonth(delta: number) {
    const nextAccrual = shiftYm(accrualInput || filterAccrualYm, delta);
    const nextPayment = shiftYm(paymentInput || filterPaymentYm, delta);
    setAccrualInput(nextAccrual);
    setPaymentInput(nextPayment);
    navigate({ accrualYm: nextAccrual, paymentYm: nextPayment });
  }

  const company =
    earnedData?.company ??
    businessData?.company ??
    dailyData?.company ??
    otherData?.company ??
    null;
  const isAgentView =
    earnedData?.publication?.isAgentView ??
    businessData?.publication?.isAgentView ??
    dailyData?.publication?.isAgentView ??
    otherData?.publication?.isAgentView ??
    false;

  const earnedSummary = useMemo(
    () => buildEarnedSummary(earnedData),
    [earnedData],
  );
  const businessSummary = useMemo(
    () => buildBusinessSummary(businessData),
    [businessData],
  );
  const dailySummary = useMemo(() => buildDailySummary(dailyData), [dailyData]);
  const otherSummary = useMemo(() => buildOtherSummary(otherData), [otherData]);

  const summaryMap: Record<IncomeTab, ReturnType<typeof buildEarnedSummary>> = {
    earned: earnedSummary,
    business: businessSummary,
    daily: dailySummary,
    other: otherSummary,
  };

  const grandTotal = useMemo(
    () =>
      buildGrandTotal([
        earnedSummary,
        businessSummary,
        dailySummary,
        otherSummary,
      ]),
    [earnedSummary, businessSummary, dailySummary, otherSummary],
  );

  const toCurrency = (value: number) => `₩ ${formatNumber(value)}`;

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-450 p-6 lg:p-8">
        <div className="mb-8">
          <Link
            href={`/company/${id}/salary/dashboard`}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98]"
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
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            인건비 대시보드
          </Link>
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

        {grandTotal && (
          <SummaryCardsRow summary={grandTotal} toCurrency={toCurrency} />
        )}

        {loading ? (
          <LoadingPanel />
        ) : error ? (
          <ErrorPanel message={error} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["earned", "business", "daily", "other"] as IncomeTab[]).map(
              (tab) => (
                <DashboardCard
                  key={tab}
                  tab={tab}
                  summary={summaryMap[tab]}
                  loading={false}
                  onClick={() => switchTab(tab)}
                />
              ),
            )}
          </div>
        )}

        {/* 월별 급여 통계 차트 */}
        {statsLoading ? (
          <div className="my-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <div className="h-90 animate-pulse rounded-lg bg-gray-50" />
          </div>
        ) : (
          statsData && (
            <MonthlyStatsChart
              stats={statsData.stats}
              months={statsData.months}
              onMonthsChange={setStatsMonths}
            />
          )
        )}
      </div>
    </div>
  );
}

export default function SalaryPage() {
  return (
    <Suspense>
      <SalaryPageInner />
    </Suspense>
  );
}
