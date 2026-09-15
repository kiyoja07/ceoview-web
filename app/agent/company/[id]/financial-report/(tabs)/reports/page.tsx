"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ReportRow = {
  id: string;
  fileName: string | null;
  fiscalYear: number | null;
  period: string | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
  uploadedAt: string;
  publishStatus: "SAVED" | "PUBLISHED";
};

export default function AgentFinancialReportReportsPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const res = await fetch(
      `/api/agent/financial-report/reports?companyId=${companyId}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports ?? []);
      setActiveReportId(data.activeReportId ?? null);
    }
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadReports();
    })().catch(() => {
      if (!cancelled) setError("저장된 리포트를 불러오지 못했습니다.");
    });
    return () => {
      cancelled = true;
    };
  }, [loadReports]);

  const publish = async (reportId: string) => {
    setMessage(null);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/agent/financial-report/upload/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "게시 실패");
      setMessage("리포트를 게시했습니다. 이제 거래처가 확인할 수 있습니다.");
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            저장된 리포트
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            저장된 재무 리포트를 확인하고 게시하세요.
          </p>
        </header>

        {message && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
          {reports.length === 0 ? (
            <p className="text-sm text-gray-500">저장된 리포트가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => {
                const isActive = r.id === activeReportId;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-900">
                        {r.fileName ?? "리포트"}{" "}
                        <span className="text-xs text-gray-500">
                          {r.period
                            ? `· ${r.period}`
                            : r.fiscalYear
                              ? `· ${r.fiscalYear}년`
                              : ""}{" "}
                          · {r.entryCount.toLocaleString()}건
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.uploadedAt).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          게시됨
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                          미게시
                        </span>
                      )}
                      <a
                        href={`/company/${companyId}/financial-report?reportId=${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition hover:bg-gray-50"
                      >
                        보기
                      </a>
                      <a
                        href={`/agent/company/${companyId}/financial-report/entries?reportId=${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition hover:bg-gray-50"
                      >
                        거래 내역
                      </a>
                      <button
                        type="button"
                        disabled={busy || isActive}
                        onClick={() => publish(r.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
                      >
                        {isActive ? "게시 중" : "게시"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
