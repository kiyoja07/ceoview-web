"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Catalog = {
  id: string;
  name: string;
  sourceFileName: string | null;
  entryCount: number;
  createdAt: string;
};
type ReportRow = {
  id: string;
  fileName: string | null;
  fiscalYear: number | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
  uploadedAt: string;
  publishStatus: "SAVED" | "PUBLISHED";
};
type PreviewEntry = {
  rowIndex: number;
  gubunja: string;
  yearMonth: string | null;
  debitAccount: string | null;
  debitAmount: number;
  creditAccount: string | null;
  creditAmount: number;
  debitStandardName: string | null;
};
type Preview = {
  saved: boolean;
  reportId?: string;
  fiscalYear: number | null;
  entryCount: number;
  debitTotal: number;
  creditTotal: number;
  entries: PreviewEntry[];
};

const won = (v: number) => `₩ ${Math.round(v).toLocaleString()}`;

export default function AgentFinancialReportPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const catalogInputRef = useRef<HTMLInputElement>(null);
  const journalInputRef = useRef<HTMLInputElement>(null);

  const loadCatalogs = useCallback(async () => {
    const res = await fetch(`/api/agent/financial-report/account-catalog`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setCatalogs(data.catalogs ?? []);
      setSelectedCatalogId((prev) => prev || (data.catalogs?.[0]?.id ?? ""));
    }
  }, []);

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
      await Promise.all([loadCatalogs(), loadReports()]);
    })().catch(() => {
      if (!cancelled) setError("초기 데이터를 불러오지 못했습니다.");
    });
    return () => {
      cancelled = true;
    };
  }, [loadCatalogs, loadReports]);

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  const uploadCatalog = async (file: File) => {
    resetMessages();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/agent/financial-report/account-catalog`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "매핑 업로드 실패");
      setMessage(`계정과목 매핑 저장 완료 (${data.entryCount}개 계정)`);
      await loadCatalogs();
      setSelectedCatalogId(data.catalogId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
      if (catalogInputRef.current) catalogInputRef.current.value = "";
    }
  };

  const generate = async (save: boolean) => {
    resetMessages();
    const file = journalInputRef.current?.files?.[0];
    if (!file) {
      setError("분개장 엑셀 파일을 선택해주세요.");
      return;
    }
    if (!selectedCatalogId) {
      setError("계정과목 매핑을 선택하거나 업로드해주세요.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("companyId", companyId);
      fd.append("accountCatalogId", selectedCatalogId);
      fd.append("save", String(save));
      const res = await fetch(`/api/agent/financial-report/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "리포트 생성 실패");
      setPreview({
        saved: data.saved,
        reportId: data.reportId,
        fiscalYear: data.fiscalYear,
        entryCount: data.entryCount,
        debitTotal: data.debitTotal,
        creditTotal: data.creditTotal,
        entries: data.entries ?? [],
      });
      setMessage(
        save
          ? `리포트 저장 완료 (${data.savedCount}건). 아래에서 게시하세요.`
          : `미리보기 생성 완료 (${data.entryCount}건).`,
      );
      if (save) await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async (reportId: string) => {
    resetMessages();
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white">재무리포트 생성</h1>
        <p className="mt-1 text-sm text-gray-400">
          위하고 분개장을 업로드해 재무 리포트를 생성하고, 게시하면 거래처가
          확인할 수 있습니다. (직원에게는 노출되지 않습니다)
        </p>
      </header>

      {message && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* 1. 계정과목 매핑 */}
      <section className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="mb-1 text-sm font-semibold text-white">
          1. 계정과목 매핑
        </h2>
        <p className="mb-3 text-xs text-gray-400">
          기존에 업로드한 매핑을 재사용하거나, 새 CSV/엑셀을 업로드하세요.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCatalogId}
            onChange={(e) => setSelectedCatalogId(e.target.value)}
            className="min-w-56 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
          >
            <option value="">매핑 선택…</option>
            {catalogs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.entryCount}개)
              </option>
            ))}
          </select>
          <label className="cursor-pointer rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 transition hover:bg-white/5">
            새 매핑 업로드
            <input
              ref={catalogInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadCatalog(f);
              }}
            />
          </label>
        </div>
      </section>

      {/* 2. 분개장 업로드 */}
      <section className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="mb-1 text-sm font-semibold text-white">
          2. 분개장 업로드
        </h2>
        <p className="mb-3 text-xs text-gray-400">
          위하고 분개장 원본(.xls / .xlsx)을 선택하세요.
        </p>
        <input
          ref={journalInputRef}
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => generate(false)}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/5 disabled:opacity-50"
          >
            미리보기
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => generate(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            생성 및 저장
          </button>
        </div>
      </section>

      {/* 미리보기 */}
      {preview && (
        <section className="mb-6 rounded-xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">
            리포트 미리보기{" "}
            <span className="ml-1 text-xs font-normal text-gray-400">
              {preview.fiscalYear ? `${preview.fiscalYear}년 · ` : ""}
              {preview.entryCount.toLocaleString()}건 · 차변{" "}
              {won(preview.debitTotal)} / 대변 {won(preview.creditTotal)}
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-xs">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="py-1.5 pr-3">구분자</th>
                  <th className="py-1.5 pr-3">차변 계정</th>
                  <th className="py-1.5 pr-3 text-right">차변</th>
                  <th className="py-1.5 pr-3">대변 계정</th>
                  <th className="py-1.5 pr-3 text-right">대변</th>
                  <th className="py-1.5 pr-3">표준계정</th>
                </tr>
              </thead>
              <tbody>
                {preview.entries.slice(0, 20).map((e) => (
                  <tr
                    key={e.rowIndex}
                    className="border-b border-gray-700/50 text-gray-300"
                  >
                    <td className="py-1.5 pr-3 font-mono text-gray-500">
                      {e.gubunja}
                    </td>
                    <td className="py-1.5 pr-3">{e.debitAccount ?? "-"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {e.debitAmount.toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3">{e.creditAccount ?? "-"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {e.creditAmount.toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-400">
                      {e.debitStandardName ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.saved && preview.reportId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => publish(preview.reportId!)}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              이 리포트 게시
            </button>
          )}
        </section>
      )}

      {/* 3. 저장된 리포트 */}
      <section className="rounded-xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">
          3. 저장된 리포트
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400">저장된 리포트가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => {
              const isActive = r.id === activeReportId;
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {r.fileName ?? "리포트"}{" "}
                      <span className="text-xs text-gray-500">
                        {r.fiscalYear ? `· ${r.fiscalYear}년` : ""} ·{" "}
                        {r.entryCount.toLocaleString()}건
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.uploadedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        게시됨
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                        미게시
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={busy || isActive}
                      onClick={() => publish(r.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
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
  );
}
