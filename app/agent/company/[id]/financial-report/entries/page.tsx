"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";

type Entry = {
  rowIndex: number;
  gubunja: string;
  yearMonth: string | null;
  debitAccount: string | null;
  debitAmount: number;
  debitStandardName: string | null;
  debitUsage: string | null;
  debitIsRevenue: boolean;
  debitIsExpense: boolean;
  debitPartnerName: string | null;
  creditAccount: string | null;
  creditAmount: number;
  creditIsRevenue: boolean;
  creditPartnerName: string | null;
};
type ReportMeta = {
  id: string;
  fiscalYear: number | null;
  fileName: string | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
  uploadedAt: string;
};
type FilterType = "all" | "revenue" | "expense" | "unspecified";
type FilterStat = { count: number; debitSum: number; creditSum: number };
type Counts = Record<FilterType, FilterStat>;

const EMPTY_STAT: FilterStat = { count: 0, debitSum: 0, creditSum: 0 };

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "revenue", label: "수익" },
  { key: "expense", label: "비용" },
  { key: "unspecified", label: "미지정" },
];

function EntriesInner() {
  const { id: companyId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const backHref = `/agent/company/${companyId}/financial-report`;

  const [report, setReport] = useState<ReportMeta | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [counts, setCounts] = useState<Counts>({
    all: EMPTY_STAT,
    revenue: EMPTY_STAT,
    expense: EMPTY_STAT,
    unspecified: EMPTY_STAT,
  });
  const [loading, setLoading] = useState(Boolean(reportId));
  const [error, setError] = useState<string | null>(
    reportId ? null : "리포트가 지정되지 않았습니다.",
  );
  const size = 50;

  const load = useCallback(
    async (p: number, t: FilterType) => {
      if (!reportId) return;
      const res = await fetch(
        `/api/agent/financial-report/entries?companyId=${companyId}&reportId=${reportId}&page=${p}&size=${size}&type=${t}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "거래 내역을 불러오지 못했습니다.");
      setReport(data.report);
      setEntries(data.rows ?? []);
      setTotal(data.total ?? 0);
      if (data.counts) setCounts(data.counts);
    },
    [companyId, reportId],
  );

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await load(1, "all");
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
  }, [load, reportId]);

  const onPage = async (p: number) => {
    setPage(p);
    try {
      await load(p, filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    }
  };

  const onFilter = async (t: FilterType) => {
    if (t === filter) return;
    setFilter(t);
    setPage(1);
    try {
      await load(1, t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / size));

  // "전체" 탭은 업로드 시점에 원본 분개장 라인에서 직접 집계한 report.debitTotal/creditTotal을
  // 그대로 쓴다(항상 원본과 정확히 일치). 나머지 탭은 짝지어진 대변 라인을
  // (전표·계정·금액) 기준으로 중복 제거해 집계한 값을 사용한다.
  const filterDebitTotal =
    filter === "all" ? (report?.debitTotal ?? 0) : counts[filter].debitSum;
  const filterCreditTotal =
    filter === "all" ? (report?.creditTotal ?? 0) : counts[filter].creditSum;

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700"
        >
          ← 재무리포트 생성으로 돌아가기
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            거래 내역 (차변 · 대변)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {report?.fileName ?? "리포트"}
            {report?.fiscalYear ? ` · ${report.fiscalYear}년` : ""} · 세무대리인
            전용 — 거래처에는 노출되지 않습니다.
          </p>
        </header>

        {loading ? (
          <LoadingPanel card />
        ) : error ? (
          <ErrorPanel
            message={error}
            card
            onRetry={reportId ? () => void onPage(page) : undefined}
          />
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900">거래 원장</h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {FILTER_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onFilter(key)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        filter === key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                          filter === key
                            ? "bg-blue-500 text-blue-100"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {counts[key].count.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-400">
                  총 {total.toLocaleString()}건
                </span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="font-medium text-gray-500">
                {FILTER_OPTIONS.find((o) => o.key === filter)?.label} 합계
              </span>
              <span className="text-gray-700">
                차변{" "}
                <span className="font-mono font-semibold tabular-nums">
                  {filterDebitTotal.toLocaleString()}
                </span>
              </span>
              <span className="text-gray-700">
                대변{" "}
                <span className="font-mono font-semibold tabular-nums">
                  {filterCreditTotal.toLocaleString()}
                </span>
              </span>
              {filter === "all" && filterDebitTotal !== filterCreditTotal && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
                  차액{" "}
                  {(filterDebitTotal - filterCreditTotal).toLocaleString()}
                </span>
              )}
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
                          {e.creditIsRevenue && (
                            <span className="rounded bg-emerald-50 px-1 text-xs text-emerald-600">
                              수익
                            </span>
                          )}
                          {!e.creditIsRevenue && !e.debitIsExpense && (
                            <span className="rounded bg-gray-100 px-1 text-xs text-gray-500">
                              미지정
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
        )}
      </div>
    </div>
  );
}

export default function AgentFinancialReportEntriesPage() {
  return (
    <Suspense fallback={null}>
      <EntriesInner />
    </Suspense>
  );
}
