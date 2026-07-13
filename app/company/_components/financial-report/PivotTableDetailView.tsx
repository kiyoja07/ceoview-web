"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageError, PageLoading } from "@/app/_components/ui/PageState";
import { PivotTableCard } from "./PivotTableCard";
import { PIVOT_TABLE_CONFIG, isPivotKey, type Summary } from "./types";

export function PivotTableDetailView({
  statsUrl,
  backHref,
  pivotKey,
}: {
  statsUrl: string;
  backHref: string;
  pivotKey: string;
}) {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const reportQuery = reportId
    ? `?reportId=${encodeURIComponent(reportId)}`
    : "";

  const [summary, setSummary] = useState<Summary | null>(null);
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

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <PageError message={error} onRetry={() => setRetryKey((k) => k + 1)} />
    );
  }

  if (!isPivotKey(pivotKey) || !summary?.standardReports) {
    return (
      <div className="min-h-screen bg-app-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-gray-500">표시할 데이터가 없습니다.</p>
          <Link
            href={backHref}
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700"
          >
            ← 재무리포트로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const config = PIVOT_TABLE_CONFIG[pivotKey];
  const table = summary.standardReports[pivotKey];

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700"
        >
          ← 재무리포트로 돌아가기
        </Link>
        <PivotTableCard
          title={config.title}
          table={table}
          itemHeader={config.itemHeader}
        />
      </div>
    </div>
  );
}
