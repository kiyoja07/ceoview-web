"use client";

import { useMemo } from "react";
import {
  formatDateTime,
  formatPreviewValue,
  NON_SUM_COLUMN_KEYS,
  toNumericValue,
} from "../_lib/format";
import type { UploadPreviewResponse } from "../_lib/types";

type Props = {
  previewLoading: boolean;
  previewError: string | null;
  previewData: UploadPreviewResponse | null;
  onClose: () => void;
};

export default function PreviewModal({
  previewLoading,
  previewError,
  previewData,
  onClose,
}: Props) {
  const previewColumnSums = useMemo(() => {
    if (!previewData || previewData.rows.length === 0) return null;

    const sums: Record<string, number> = {};
    let hasSum = false;

    for (const column of previewData.columns) {
      if (NON_SUM_COLUMN_KEYS.has(column.key)) continue;

      let total = 0;
      let numericCount = 0;

      for (const row of previewData.rows) {
        const numeric = toNumericValue(row[column.key]);
        if (numeric === null) continue;
        total += numeric;
        numericCount += 1;
      }

      if (numericCount > 0) {
        sums[column.key] = total;
        hasSum = true;
      }
    }

    return hasSum ? sums : null;
  }, [previewData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              업로드 데이터 미리보기
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {previewData
                ? `${previewData.upload.incomeTypeLabel} / ${previewData.upload.fileName ?? "파일명 없음"}`
                : "업로드 데이터를 불러오는 중입니다."}
            </p>
            {previewData && (
              <p className="mt-1 text-xs text-gray-400">
                업로드: {formatDateTime(previewData.upload.uploadedAt)} · 상태:{" "}
                {previewData.upload.publishStatus}
              </p>
            )}
            {previewData && (
              <p className="mt-1 text-xs text-gray-400">
                총 {previewData.total.toLocaleString()}건 중{" "}
                {Math.min(
                  previewData.total,
                  previewData.limit,
                ).toLocaleString()}
                건 미리보기
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            닫기
          </button>
        </div>

        <div className="min-h-0 flex-1 p-4">
          {previewLoading ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
            </div>
          ) : previewError ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-red-50">
              <p className="text-sm text-red-700">{previewError}</p>
            </div>
          ) : !previewData ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">표시할 데이터가 없습니다.</p>
            </div>
          ) : previewData.rows.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                저장된 데이터 행이 없습니다.
              </p>
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {previewData.columns.map((column) => (
                      <th key={column.key} className="px-3 py-2 text-left">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.rows.map((row, index) => (
                    <tr key={`${previewData.upload.uploadId}:${index}`}>
                      {previewData.columns.map((column) => (
                        <td
                          key={`${column.key}:${index}`}
                          className="px-3 py-2 whitespace-nowrap text-gray-700"
                        >
                          {formatPreviewValue(row[column.key], column.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {previewColumnSums && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-slate-50 text-sm font-semibold text-gray-800">
                      {previewData.columns.map((column, index) => {
                        const total = previewColumnSums[column.key];
                        return (
                          <td
                            key={`sum:${column.key}`}
                            className="px-3 py-2 whitespace-nowrap"
                          >
                            {index === 0
                              ? "합계"
                              : total === undefined
                                ? "-"
                                : formatPreviewValue(total, column.key)}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
