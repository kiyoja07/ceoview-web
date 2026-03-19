"use client";

import { useMemo, useState } from "react";
import {
  renderPayslipHtml,
  type PayslipData,
} from "@/app/company/[id]/salary/lib/payslip-template";
import { renderPayslipPdfFromData } from "@/app/company/[id]/salary/lib/payslip-pdf";

interface EmployeePayslipViewerProps {
  payslipData: PayslipData;
  incomeLabel: string;
  metaLabel: string;
}

export default function EmployeePayslipViewer({
  payslipData,
  incomeLabel,
  metaLabel,
}: EmployeePayslipViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const payslipHtml = useMemo(
    () => renderPayslipHtml(payslipData),
    [payslipData],
  );

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);

      const blob = await renderPayslipPdfFromData(payslipData);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `급여명세서_${incomeLabel}_${payslipData.employeeName}_${payslipData.employeeCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("직원 포털 PDF 다운로드 실패:", error);
      setDownloadError("PDF 다운로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">{incomeLabel}</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {payslipData.employeeName}님 명세서
          </h2>
          <p className="mt-2 text-sm text-gray-500">{metaLabel}</p>
          {downloadError && (
            <p className="mt-2 text-sm text-red-600">{downloadError}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? "PDF 생성 중..." : "PDF 다운로드"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-950/5">
        <div
          className="overflow-x-auto p-4 sm:p-8"
          dangerouslySetInnerHTML={{ __html: payslipHtml }}
        />
      </div>
    </section>
  );
}
