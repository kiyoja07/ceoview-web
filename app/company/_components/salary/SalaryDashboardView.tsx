"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatBusinessNumber } from "@/app/lib/formatters";
import { INCOME_META } from "@/app/company/[id]/salary/constants";
import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";
import { formatNumber } from "@/app/company/[id]/salary/lib/format";
import type {
  MonthlyStat,
  IncomeTab,
  SalaryStatsResponse,
} from "@/app/company/[id]/salary/types";

/* ── helpers ── */

interface YearSummary {
  year: string;
  months: MonthlyStat[];
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  totalCount: number;
  monthCount: number;
}

function buildYearSummary(year: string, months: MonthlyStat[]): YearSummary {
  return months.reduce<YearSummary>(
    (acc, s) => ({
      ...acc,
      totalPayment: acc.totalPayment + s.totalPayment,
      totalDeduction: acc.totalDeduction + s.totalDeduction,
      netPayment: acc.netPayment + s.netPayment,
      totalCount: acc.totalCount + s.totalCount,
    }),
    {
      year,
      months,
      totalPayment: 0,
      totalDeduction: 0,
      netPayment: 0,
      totalCount: 0,
      monthCount: months.length,
    },
  );
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
}

function getMonthsForYear(year: string): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const y = Number(year);
  const maxMonth = y === currentYear ? currentMonth : 12;
  return Array.from({ length: maxMonth }, (_, i) => y * 100 + (i + 1));
}

/* ── 연도별 대시보드 화면 ── */

export function SalaryDashboardView({ statsUrl }: { statsUrl: string }) {
  const [data, setData] = useState<SalaryStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("__all__");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(statsUrl);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "데이터를 불러오는 데 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [statsUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 데이터가 있는 월만 필터 (최신순)
  const activeMonths = useMemo(
    () =>
      (data?.stats ?? [])
        .filter(
          (s) =>
            s.earnedPayment > 0 ||
            s.businessPayment > 0 ||
            s.dailyPayment > 0 ||
            s.otherPayment > 0,
        )
        .sort((a, b) => b.ym - a.ym),
    [data],
  );

  // 연도별 그룹핑 & 집계
  const { byYear, sortedYears, yearSummaries } = useMemo(() => {
    const grouped = activeMonths.reduce<Record<string, MonthlyStat[]>>(
      (acc, stat) => {
        const year = String(stat.ym).slice(0, 4);
        (acc[year] ??= []).push(stat);
        return acc;
      },
      {},
    );
    // 현재 연도가 없으면 빈 항목으로 자동 추가
    const currentYear = String(new Date().getFullYear());
    if (!grouped[currentYear]) {
      grouped[currentYear] = [];
    }
    const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
    const summaries: Record<string, YearSummary> = {};
    for (const y of years) {
      summaries[y] = buildYearSummary(y, grouped[y]);
    }
    return { byYear: grouped, sortedYears: years, yearSummaries: summaries };
  }, [activeMonths]);

  // 선택된 연도의 요약
  const currentSummary: YearSummary | null = selectedYear
    ? (yearSummaries[selectedYear] ?? null)
    : null;

  // 전체 요약 (selectedYear === "__all__")
  const grandSummary: YearSummary = useMemo(
    () => buildYearSummary("전체", activeMonths),
    [activeMonths],
  );

  const displaySummary =
    selectedYear === "__all__"
      ? grandSummary
      : (currentSummary ?? grandSummary);

  // 전년도 대비 변동률
  const prevYear =
    selectedYear && selectedYear !== "__all__"
      ? String(Number(selectedYear) - 1)
      : null;
  const prevSummary = prevYear ? (yearSummaries[prevYear] ?? null) : null;

  // 표시할 연도 목록
  const visibleYears =
    selectedYear === "__all__"
      ? sortedYears
      : selectedYear
        ? [selectedYear]
        : sortedYears;

  if (loading) {
    return <LoadingPanel />;
  }

  if (error) {
    return <ErrorPanel message={error} />;
  }

  const companyId = data?.company.id;

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-350 p-6 lg:p-8">
        {/* 헤더 */}
        <div className="mb-8 rounded-3xl bg-linear-to-br from-blue-950 via-blue-900 to-indigo-800 px-6 py-7 text-white shadow-lg shadow-blue-200/60">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                인건비 지급 현황
              </h1>
              {data?.company && (
                <p className="mt-2 text-sm text-blue-100/90">
                  {data.company.businessName ?? "이름 없음"}
                  <span className="mx-1.5 text-blue-300/50">•</span>
                  <span className="font-mono text-xs text-blue-200/70">
                    {formatBusinessNumber(data.company.businessNumber)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 연도 선택 탭 ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedYear("__all__")}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                selectedYear === "__all__"
                  ? "bg-gray-800 text-white shadow-md shadow-gray-300"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
              }`}
            >
              전체
            </button>
            {sortedYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  selectedYear === year
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                }`}
              >
                {year}년
              </button>
            ))}
          </div>
        </div>

        {/* ── 선택 연도 요약 카드 ── */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStatCard
            label={
              selectedYear === "__all__"
                ? "총 지급 월수"
                : `${selectedYear}년 지급 월수`
            }
            value={`${displaySummary.monthCount}개월`}
            color="indigo"
            change={null}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            }
          />
          <SummaryStatCard
            label="총 지급액"
            value={`₩ ${formatNumber(displaySummary.totalPayment)}`}
            color="blue"
            change={
              prevSummary
                ? pctChange(
                    displaySummary.totalPayment,
                    prevSummary.totalPayment,
                  )
                : null
            }
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            }
          />
          <SummaryStatCard
            label="총 공제액"
            value={`₩ ${formatNumber(displaySummary.totalDeduction)}`}
            color="rose"
            change={
              prevSummary
                ? pctChange(
                    displaySummary.totalDeduction,
                    prevSummary.totalDeduction,
                  )
                : null
            }
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            }
          />
          <SummaryStatCard
            label="차인지급액"
            value={`₩ ${formatNumber(displaySummary.netPayment)}`}
            color="emerald"
            change={
              prevSummary
                ? pctChange(displaySummary.netPayment, prevSummary.netPayment)
                : null
            }
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                />
              </svg>
            }
          />
        </div>

        {/* ── 연도별 소득유형 분포 (선택 연도) ── */}
        {selectedYear !== "__all__" && currentSummary && (
          <IncomeBreakdownBar
            months={currentSummary.months}
            year={selectedYear!}
          />
        )}

        {/* ── 연도별 월 카드 목록 ── */}
        {visibleYears.map((year) => {
          const yearData = yearSummaries[year];
          if (!yearData) return null;

          return (
            <section key={year} className="mb-10">
              {/* 연도 헤더 (전체 보기에서만 표시) */}
              {selectedYear === "__all__" && (
                <YearSectionHeader
                  summary={yearData}
                  onSelect={() => setSelectedYear(year)}
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {selectedYear === "__all__"
                  ? (byYear[year] ?? []).map((stat) => (
                      <MonthCard
                        key={stat.ym}
                        stat={stat}
                        companyId={companyId}
                      />
                    ))
                  : getMonthsForYear(year).map((ym) => {
                      const stat = (byYear[year] ?? []).find(
                        (s) => s.ym === ym,
                      );
                      return stat ? (
                        <MonthCard key={ym} stat={stat} companyId={companyId} />
                      ) : (
                        <EmptyMonthCard key={ym} ym={ym} />
                      );
                    })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ── 연도 섹션 헤더 (전체 보기용) ── */

function YearSectionHeader({
  summary,
  onSelect,
}: {
  summary: YearSummary;
  onSelect: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        onClick={onSelect}
        className="group flex items-center gap-2 text-left"
      >
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
          {summary.year}년
        </h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          {summary.monthCount}개월
        </span>
        <svg
          className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </button>
      <div className="flex items-center gap-4 text-xs tabular-nums">
        <span className="text-gray-400">
          지급{" "}
          <span className="font-semibold text-blue-700">
            ₩ {formatNumber(summary.totalPayment)}
          </span>
        </span>
        <span className="text-gray-400">
          공제{" "}
          <span className="font-semibold text-rose-600">
            ₩ {formatNumber(summary.totalDeduction)}
          </span>
        </span>
        <span className="text-gray-400">
          차인{" "}
          <span className="font-semibold text-emerald-700">
            ₩ {formatNumber(summary.netPayment)}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ── 소득유형 분포 바 (선택 연도용) ── */

function IncomeBreakdownBar({
  months,
  year,
}: {
  months: MonthlyStat[];
  year: string;
}) {
  const totals = months.reduce(
    (acc, s) => ({
      earned: acc.earned + s.earnedPayment,
      business: acc.business + s.businessPayment,
      daily: acc.daily + s.dailyPayment,
      other: acc.other + s.otherPayment,
    }),
    { earned: 0, business: 0, daily: 0, other: 0 },
  );

  const grand =
    totals.earned + totals.business + totals.daily + totals.other || 1;

  const items = (
    [
      { tab: "earned" as IncomeTab, amount: totals.earned },
      { tab: "business" as IncomeTab, amount: totals.business },
      { tab: "daily" as IncomeTab, amount: totals.daily },
      { tab: "other" as IncomeTab, amount: totals.other },
    ] satisfies { tab: IncomeTab; amount: number }[]
  ).filter((i) => i.amount > 0);

  return (
    <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        {year}년 소득유형 분포
      </h3>
      {/* 비율 바 */}
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-gray-100">
        {items.map(({ tab, amount }) => {
          const pct = (amount / grand) * 100;
          return (
            <div
              key={tab}
              className={`bg-linear-to-r ${INCOME_META[tab].gradient}`}
              style={{ width: `${pct}%` }}
              title={`${INCOME_META[tab].label}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map(({ tab, amount }) => {
          const pct = (amount / grand) * 100;
          return (
            <div key={tab} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full bg-linear-to-br ${INCOME_META[tab].gradient}`}
              />
              <span className="text-xs text-gray-500">
                {INCOME_META[tab].label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-gray-700">
                ₩ {formatNumber(amount)}
              </span>
              <span className="text-[10px] text-gray-400">
                ({pct.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 월별 카드 ── */

function MonthCard({
  stat,
  companyId,
}: {
  stat: MonthlyStat;
  companyId: string | undefined;
}) {
  const ym = String(stat.ym);
  const month = Number(ym.slice(4));
  const displayMonth = `${month}월`;

  const incomeBreakdown = (
    [
      {
        tab: "earned" as IncomeTab,
        payment: stat.earnedPayment,
        count: stat.earnedCount,
      },
      {
        tab: "business" as IncomeTab,
        payment: stat.businessPayment,
        count: stat.businessCount,
      },
      {
        tab: "daily" as IncomeTab,
        payment: stat.dailyPayment,
        count: stat.dailyCount,
      },
      {
        tab: "other" as IncomeTab,
        payment: stat.otherPayment,
        count: stat.otherCount,
      },
    ] satisfies { tab: IncomeTab; payment: number; count: number }[]
  ).filter((item) => item.payment > 0 || item.count > 0);

  return (
    <Link
      href={`/company/${companyId}/salary?accrualYm=${ym}&paymentYm=${ym}&page=1`}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition-all hover:shadow-md hover:ring-gray-950/10"
    >
      {/* 상단: 월 표시 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {displayMonth}
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            {stat.totalCount}명
          </span>
        </div>
        <svg
          className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </div>

      {/* 금액 요약 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">총 지급액</span>
          <span className="text-sm font-semibold tabular-nums text-blue-700">
            ₩ {formatNumber(stat.totalPayment)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">총 공제액</span>
          <span className="text-sm font-semibold tabular-nums text-rose-600">
            ₩ {formatNumber(stat.totalDeduction)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
          <span className="text-xs font-medium text-gray-500">차인지급액</span>
          <span className="text-base font-bold tabular-nums text-emerald-700">
            ₩ {formatNumber(stat.netPayment)}
          </span>
        </div>
      </div>

      {/* 소득유형 뱃지 */}
      {incomeBreakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-50 pt-3">
          {incomeBreakdown.map(({ tab, count }) => {
            const meta = INCOME_META[tab];
            return (
              <span
                key={tab}
                className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600"
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full bg-linear-to-br ${meta.gradient}`}
                />
                {meta.label} {count}건
              </span>
            );
          })}
        </div>
      )}
    </Link>
  );
}

/* ── 빈 월 카드 ── */

function EmptyMonthCard({ ym }: { ym: number }) {
  const month = Number(String(ym).slice(4));
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-300">{month}월</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1.5 py-5">
        <svg
          className="h-8 w-8 text-gray-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
        <span className="text-sm text-gray-400">급여 없음</span>
      </div>
    </div>
  );
}

/* ── 요약 통계 카드 (전년 대비 변동률 포함) ── */

const COLOR_MAP: Record<string, string> = {
  indigo: "from-indigo-500 to-indigo-600 shadow-indigo-200",
  blue: "from-blue-500 to-blue-600 shadow-blue-200",
  rose: "from-rose-500 to-rose-600 shadow-rose-200",
  emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
};

function SummaryStatCard({
  label,
  value,
  color,
  icon,
  change,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  change: number | null;
}) {
  const colorClasses = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${colorClasses} text-white shadow-lg`}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums text-gray-900">{value}</p>
      {change !== null && (
        <p
          className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
            change >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {change >= 0 ? (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25"
              />
            </svg>
          )}
          전년 대비 {change >= 0 ? "+" : ""}
          {change.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
