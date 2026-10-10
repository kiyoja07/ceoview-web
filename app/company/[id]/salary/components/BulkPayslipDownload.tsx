"use client";

import { useState } from "react";
import { PAYSLIP_INCOME_TAB_LABELS } from "@/catalogs/ko/salary";
import type { Company, IncomeTab } from "@/types/company/salary";

interface BulkPayslipDownloadProps {
  companyId: string;
  incomeType: IncomeTab;
  company: Company | null;
  totalCount: number;
  accrualYm?: string;
  paymentYm?: string;
}

const ENDPOINT_MAP: Record<IncomeTab, string> = {
  earned: "earned-income",
  business: "business-income",
  daily: "daily-income-labor",
  other: "other-income",
};

export function BulkPayslipDownload({
  companyId,
  incomeType,
  company,
  totalCount,
  accrualYm,
  paymentYm,
}: BulkPayslipDownloadProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [status, setStatus] = useState("");

  const handleDownload = async () => {
    if (generating || totalCount === 0) return;
    setGenerating(true);
    setStatus("데이터 조회 중…");

    try {
      // 1. Fetch all rows from the API
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("size", String(Math.max(totalCount, 10000)));
      if (accrualYm) params.set("accrualYm", accrualYm);
      if (paymentYm) params.set("paymentYm", paymentYm);

      const endpoint = `/api/company/${companyId}/${ENDPOINT_MAP[incomeType]}?${params}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`데이터 조회 실패 (${res.status})`);

      const data = await res.json();
      const rows = data.rows;
      if (!rows?.length) {
        alert("다운로드할 데이터가 없습니다.");
        return;
      }

      setStatus("PDF 생성 중…");
      setProgress({ done: 0, total: rows.length });

      // 2. Generate ZIP
      const { generatePayslipZip } = await import("@/app/lib/payslip/payslip-pdf");

      const blob = await generatePayslipZip(
        rows,
        incomeType,
        company,
        (done, total) => setProgress({ done, total }),
      );

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `급여명세서_${PAYSLIP_INCOME_TAB_LABELS[incomeType]}_${rows.length}명.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF 생성 실패:", err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
      setProgress({ done: 0, total: 0 });
      setStatus("");
    }
  };

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={generating || totalCount === 0}
      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {generating && (
        <div
          className="absolute inset-0 bg-emerald-500/30 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {generating ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>
              {status} {progress.done}/{progress.total}명 ({pct}%)
            </span>
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <span>전체 명세서 다운로드 ({totalCount}명)</span>
          </>
        )}
      </span>
    </button>
  );
}
