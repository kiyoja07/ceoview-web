"use client";

import { useMemo, useState } from "react";
import {
  getPayslipFileName,
  renderPayslipPdfFromData,
} from "@/app/company/[id]/salary/lib/payslip-pdf";
import {
  renderPayslipHtml,
  type PayslipData,
} from "@/app/company/[id]/salary/lib/payslip-template";

interface PayslipViewerProps {
  payslipData: PayslipData;
}

export function PayslipViewer({ payslipData }: PayslipViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const payslipHtml = useMemo(
    () => renderPayslipHtml(payslipData),
    [payslipData],
  );

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await renderPayslipPdfFromData(payslipData);
      const fileName = getPayslipFileName(payslipData);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">급여명세서 열람</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">
              {payslipData.employeeName}님 명세서
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              링크는 1회용으로 처리되며, 현재 화면에서만 확인할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "PDF 생성 중..." : "PDF 다운로드"}
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-950/5">
          <div
            className="overflow-x-auto p-4 sm:p-8"
            dangerouslySetInnerHTML={{ __html: payslipHtml }}
          />
        </div>
      </div>
    </main>
  );
}
