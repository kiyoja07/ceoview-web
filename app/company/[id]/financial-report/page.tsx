"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyPoint = {
  ym: string;
  debit: number;
  credit: number;
  expense: number;
  revenue: number;
};
type NamedAmount = { name: string; amount: number };
type Summary = {
  fiscalYear: number | null;
  monthly: MonthlyPoint[];
  byUsage: NamedAmount[];
  topDebitAccounts: NamedAmount[];
  topPartners: NamedAmount[];
  expenseTotal: number;
  revenueTotal: number;
};
type Totals = {
  fiscalYear: number | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
};
type Publication = {
  publishStatus: "NONE" | "SAVED" | "PUBLISHED";
  companyVisible: boolean;
  fiscalYear: number | null;
  uploadedAt: string | null;
};
type Entry = {
  rowIndex: number;
  gubunja: string;
  yearMonth: string | null;
  entryDate: string | null;
  voucherNo: string | null;
  debitAccount: string | null;
  debitAmount: number;
  debitStandardName: string | null;
  debitUsage: string | null;
  debitIsRevenue: boolean;
  debitIsExpense: boolean;
  debitPartnerName: string | null;
  creditAccount: string | null;
  creditAmount: number;
  creditPartnerName: string | null;
};

const won = (v: number) => `₩ ${Math.round(v).toLocaleString()}`;
function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(1)}억`;
  if (abs >= 1_0000) return `${Math.round(value / 1_0000).toLocaleString()}만`;
  return value.toLocaleString();
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
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

function HorizontalBars({
  title,
  items,
  color,
}: {
  title: string;
  items: NamedAmount[];
  color: string;
}) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.amount)));
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <h3 className="mb-4 text-base font-bold text-gray-900">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">데이터가 없습니다.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.name} className="text-sm">
              <div className="mb-1 flex justify-between">
                <span className="truncate text-gray-600">{item.name}</span>
                <span className="ml-2 shrink-0 font-medium tabular-nums text-gray-800">
                  {won(item.amount)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${(Math.abs(item.amount) / max) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FinancialReportInner() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const size = 50;

  const loadStats = useCallback(async () => {
    const res = await fetch(`/api/company/${id}/financial-report-stats`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("통계를 불러오지 못했습니다.");
    const data = await res.json();
    setSummary(data.summary);
    setTotals(data.totals);
    setPublication(data.publication);
  }, [id]);

  const loadEntries = useCallback(
    async (p: number) => {
      const res = await fetch(
        `/api/company/${id}/financial-report?page=${p}&size=${size}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("거래 내역을 불러오지 못했습니다.");
      const data = await res.json();
      setEntries(data.rows ?? []);
      setTotal(data.total ?? 0);
    },
    [id],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadStats(), loadEntries(1)]);
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
  }, [loadStats, loadEntries]);

  const onPage = async (p: number) => {
    setPage(p);
    try {
      await loadEntries(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / size));
  const hasReport = Boolean(
    publication?.companyVisible && summary && totals && total > 0,
  );

  const monthly = useMemo(() => summary?.monthly ?? [], [summary]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-gray-400">
        불러오는 중…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">재무리포트</h1>
        <p className="mt-1 text-sm text-gray-400">
          세무대리인이 작성한 분개장 기반 재무 리포트입니다.
        </p>
      </header>

      {!hasReport ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
          <p className="text-gray-500">아직 게시된 재무 리포트가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-400">
            세무대리인이 리포트를 게시하면 이곳에서 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryCard
              label="회계연도"
              value={totals!.fiscalYear ? `${totals!.fiscalYear}년` : "-"}
            />
            <SummaryCard
              label="거래 건수"
              value={`${totals!.entryCount.toLocaleString()}건`}
            />
            <SummaryCard label="차변 총액" value={won(totals!.debitTotal)} />
            <SummaryCard label="대변 총액" value={won(totals!.creditTotal)} />
            <SummaryCard
              label="비용 합계"
              value={won(summary!.expenseTotal)}
              accent="text-rose-600"
            />
            <SummaryCard
              label="수익 합계"
              value={won(summary!.revenueTotal)}
              accent="text-emerald-600"
            />
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
                <Line
                  type="monotone"
                  dataKey="debit"
                  name="총 차변"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </section>

          {/* 계정과목 / 용도 집계 */}
          <section className="mb-8 grid gap-4 lg:grid-cols-2">
            <HorizontalBars
              title="표준계정과목 상위 (차변)"
              items={summary!.topDebitAccounts}
              color="#6366f1"
            />
            <HorizontalBars
              title="거래처 상위"
              items={summary!.topPartners}
              color="#0ea5e9"
            />
          </section>

          {/* 짝지은 거래 테이블 */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                거래 내역 (차변 · 대변)
              </h2>
              <span className="text-sm text-gray-400">
                총 {total.toLocaleString()}건
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="py-2 pr-3 font-medium">구분자</th>
                    <th className="py-2 pr-3 font-medium">년월</th>
                    <th className="py-2 pr-3 font-medium">차변 계정</th>
                    <th className="py-2 pr-3 text-right font-medium">차변</th>
                    <th className="py-2 pr-3 font-medium">대변 계정</th>
                    <th className="py-2 pr-3 text-right font-medium">대변</th>
                    <th className="py-2 pr-3 font-medium">표준계정</th>
                    <th className="py-2 pr-3 font-medium">용도</th>
                    <th className="py-2 pr-3 font-medium">거래처</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr
                      key={e.rowIndex}
                      className="border-b border-gray-50 text-gray-700"
                    >
                      <td className="py-2 pr-3 font-mono text-xs text-gray-400">
                        {e.gubunja}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {e.yearMonth ?? "-"}
                      </td>
                      <td className="py-2 pr-3">{e.debitAccount ?? "-"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {e.debitAmount.toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">{e.creditAccount ?? "-"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {e.creditAmount.toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1">
                          {e.debitStandardName ?? "-"}
                          {e.debitIsExpense && (
                            <span className="rounded bg-rose-50 px-1 text-xs text-rose-600">
                              비용
                            </span>
                          )}
                          {e.debitIsRevenue && (
                            <span className="rounded bg-emerald-50 px-1 text-xs text-emerald-600">
                              수익
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-500">
                        {e.debitUsage ?? "-"}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">
                        {e.debitPartnerName ?? e.creditPartnerName ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function CompanyFinancialReportPage() {
  return (
    <Suspense fallback={null}>
      <FinancialReportInner />
    </Suspense>
  );
}
