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

function EntriesInner() {
  const { id: companyId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const backHref = `/agent/company/${companyId}/financial-report`;

  const [report, setReport] = useState<ReportMeta | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(Boolean(reportId));
  const [error, setError] = useState<string | null>(
    reportId ? null : "리포트가 지정되지 않았습니다.",
  );
  const size = 50;

  const load = useCallback(
    async (p: number) => {
      if (!reportId) return;
      const res = await fetch(
        `/api/agent/financial-report/entries?companyId=${companyId}&reportId=${reportId}&page=${p}&size=${size}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "거래 내역을 불러오지 못했습니다.");
      setReport(data.report);
      setEntries(data.rows ?? []);
      setTotal(data.total ?? 0);
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
        await load(1);
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
      await load(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / size));

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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">거래 원장</h2>
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
