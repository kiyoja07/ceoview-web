"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageError, PageLoading } from "@/app/_components/ui/PageState";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PivotTableCard } from "./PivotTableCard";
import {
  PIVOT_TABLE_CONFIG,
  type Publication,
  type Summary,
  type Totals,
} from "./types";

const PIVOT_ROW_LIMIT = 20;
const won = (v: number) => `₩ ${Math.round(v).toLocaleString()}`;
function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(1)}억`;
  if (abs >= 1_0000) return `${Math.round(value / 1_0000).toLocaleString()}만`;
  return value.toLocaleString();
}

// "2025년 1월" → 202501 (정렬 키)
function ymSortKey(ym: string): number {
  const m = ym.match(/(\d+)년\s*(\d+)월/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number.parseInt(m[1], 10) * 100 + Number.parseInt(m[2], 10);
}

function getSubjectParticle(value: string) {
  const lastChar = value.trim().at(-1);
  if (!lastChar) return "이";
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "이";
  return (code - 0xac00) % 28 === 0 ? "가" : "이";
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-2 py-5 shadow-sm ring-1 ring-gray-950/5">
      <p className="text-sm text-gray-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${accent ?? "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: e.color }}
          />
          <span className="text-gray-500">{e.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-gray-800">
            {won(e.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FinancialReportView({
  statsUrl,
  tableHrefBase,
}: {
  statsUrl: string;
  tableHrefBase: string;
}) {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const reportIdParam = reportId
    ? `reportId=${encodeURIComponent(reportId)}`
    : "";
  const reportQuery = reportIdParam ? `?${reportIdParam}` : "";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const loadStats = useCallback(async () => {
    const res = await fetch(`${statsUrl}${reportQuery}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("통계를 불러오지 못했습니다.");
    const data = await res.json();
    setSummary(data.summary);
    setTotals(data.totals);
    setPublication(data.publication);
  }, [statsUrl, reportQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadStats();
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStats, retryKey]);

  const hasReport = Boolean(
    (publication?.companyVisible || publication?.isAgentView) &&
    summary &&
    totals &&
    totals.entryCount > 0,
  );
  const reportAuthor =
    publication?.agentOrganizationName?.trim() || "세무대리인";
  const reportAuthorParticle = getSubjectParticle(reportAuthor);

  const monthly = useMemo(() => summary?.monthly ?? [], [summary]);

  const cashFlowMonthly = useMemo(() => {
    const cashIn = summary?.standardReports?.cashIn;
    const cashOut = summary?.standardReports?.cashOut;
    if (!cashIn && !cashOut) return [];
    const months = new Set<string>([
      ...(cashIn?.months ?? []),
      ...(cashOut?.months ?? []),
    ]);
    let cumulative = 0;
    return [...months]
      .sort((a, b) => ymSortKey(a) - ymSortKey(b))
      .map((ym) => {
        const cashInAmt = cashIn?.monthlyTotals[ym] ?? 0;
        const cashOutAmt = cashOut?.monthlyTotals[ym] ?? 0;
        const net = cashInAmt - cashOutAmt;
        cumulative += net;
        return {
          ym,
          cashIn: cashInAmt,
          cashOutNeg: -cashOutAmt,
          net,
          cumulative,
        };
      });
  }, [summary]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <PageError message={error} onRetry={() => setRetryKey((k) => k + 1)} />
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">재무리포트</h1>
          <p className="mt-1 text-sm text-gray-400">
            {reportAuthor}
            {reportAuthorParticle} 제공하는 재무 리포트입니다.
          </p>
          {publication?.isAgentView &&
            publication.publishStatus === "SAVED" && (
              <p className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                현재 미게시 상태 · 세무 대리인에게만 보이는 미리보기입니다
              </p>
            )}
        </header>

        {!hasReport ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-gray-500">
              아직 게시된 재무 리포트가 없습니다.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {reportAuthor}
              {reportAuthorParticle} 리포트를 게시하면 이곳에서 확인할 수
              있습니다.
            </p>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <SummaryCard
                label="회계연도"
                value={totals!.fiscalYear ? `${totals!.fiscalYear}년` : "-"}
              />
              <SummaryCard
                label="거래 건수"
                value={`${totals!.entryCount.toLocaleString()}건`}
              />
              <SummaryCard
                label="수익 합계"
                value={won(summary!.revenueTotal)}
                accent="text-emerald-600"
              />
              <SummaryCard
                label="비용 합계"
                value={won(summary!.expenseTotal)}
                accent="text-rose-600"
              />
              <SummaryCard label="거래액" value={won(totals!.debitTotal)} />
            </section>

            {/* 월별 추이 */}
            <section className="my-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <h2 className="mb-5 text-lg font-bold text-gray-900">
                월별 수익 · 비용 추이
              </h2>
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart
                  data={monthly}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="ym"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={compact}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(59,130,246,0.04)" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="수익"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="비용"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </section>

            {/* 월별 현금 유입·유출 */}
            {cashFlowMonthly.length > 0 && (
              <section className="my-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                <h2 className="mb-5 text-lg font-bold text-gray-900">
                  월별 현금 유입 · 유출
                </h2>
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart
                    data={cashFlowMonthly}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="ym"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={compact}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "rgba(59,130,246,0.04)" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                    <Bar
                      dataKey="cashIn"
                      name="현금 유입"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="cashOutNeg"
                      name="현금 유출"
                      fill="#ec4899"
                      radius={[0, 0, 4, 4]}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="월별 순증감"
                      stroke="#1e293b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="누적 순증감"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </section>
            )}

            {summary?.standardReports && (
              <section className="mb-8 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">
                  상세 보고서
                </h2>
                {(
                  Object.entries(PIVOT_TABLE_CONFIG) as [
                    keyof typeof PIVOT_TABLE_CONFIG,
                    (typeof PIVOT_TABLE_CONFIG)[keyof typeof PIVOT_TABLE_CONFIG],
                  ][]
                ).map(([key, config]) => (
                  <PivotTableCard
                    key={key}
                    title={config.title}
                    table={summary.standardReports![key]}
                    itemHeader={config.itemHeader}
                    maxRows={PIVOT_ROW_LIMIT}
                    viewAllHref={`${tableHrefBase}/${key}${reportQuery}`}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
