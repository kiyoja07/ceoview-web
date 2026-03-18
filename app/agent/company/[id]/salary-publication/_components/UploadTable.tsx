"use client";

import { formatDateTime, getPublishStatusLabel } from "../_lib/format";
import type { PublicationUpload, ActionType } from "../_lib/types";

type PendingAction = {
  uploadId: string;
  publishStatus: ActionType;
  fileName: string | null;
};

type Props = {
  uploads: PublicationUpload[];
  actionLoadingKey: string | null;
  onPreview: (uploadId: string) => void;
  onSetPendingAction: (action: PendingAction) => void;
};

export default function UploadTable({
  uploads,
  actionLoadingKey,
  onPreview,
  onSetPendingAction,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              <th className="px-4 py-3 text-left">소득 유형</th>
              <th className="px-4 py-3 text-left">귀속년월</th>
              <th className="px-4 py-3 text-left">지급년월</th>
              <th className="px-4 py-3 text-left">지급 건수</th>
              <th className="px-4 py-3 text-left">파일명</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">회사 노출</th>
              <th className="px-4 py-3 text-left">상태 선택</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {uploads.map((upload) => {
              const rowBusy =
                actionLoadingKey !== null &&
                actionLoadingKey.startsWith(`${upload.uploadId}:`);

              return (
                <tr key={upload.uploadId} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 text-gray-700">
                    {upload.incomeTypeLabel}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {upload.accrualYm ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {upload.paymentYm ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {upload.rowCount.toLocaleString()}건
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <button
                      type="button"
                      onClick={() => onPreview(upload.uploadId)}
                      className="max-w-80 truncate text-left text-blue-700 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800"
                      title={upload.fileName ?? "파일명 없음"}
                    >
                      {upload.fileName ?? "파일명 없음"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {upload.publishStatus === "PUBLISHED" ? (
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {getPublishStatusLabel("PUBLISHED")}
                        </span>
                        <p className="text-xs text-blue-700">
                          발행:{" "}
                          {upload.publishedAt
                            ? formatDateTime(upload.publishedAt)
                            : "-"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {getPublishStatusLabel("SAVED")}
                        </span>
                        <p className="text-xs text-amber-700">
                          업로드: {formatDateTime(upload.uploadedAt)}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {upload.companyVisible ? (
                      <span className="font-medium text-blue-700">
                        조회 가능
                      </span>
                    ) : (
                      <span className="font-medium text-amber-700">
                        조회 불가
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold transition ${
                            upload.publishStatus === "SAVED"
                              ? "text-amber-700"
                              : "text-gray-400"
                          }`}
                        >
                          {getPublishStatusLabel("SAVED")}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={upload.publishStatus === "PUBLISHED"}
                          disabled={rowBusy || !upload.canManage}
                          onClick={() =>
                            onSetPendingAction({
                              uploadId: upload.uploadId,
                              publishStatus:
                                upload.publishStatus === "PUBLISHED"
                                  ? "SAVED"
                                  : "PUBLISHED",
                              fileName: upload.fileName,
                            })
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                            upload.publishStatus === "PUBLISHED"
                              ? "bg-blue-500"
                              : "bg-amber-400"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                              upload.publishStatus === "PUBLISHED"
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                          {rowBusy && (
                            <span className="sr-only">전환 중...</span>
                          )}
                        </button>
                        <span
                          className={`text-xs font-semibold transition ${
                            upload.publishStatus === "PUBLISHED"
                              ? "text-blue-700"
                              : "text-gray-400"
                          }`}
                        >
                          {rowBusy &&
                          actionLoadingKey === `${upload.uploadId}:PUBLISHED`
                            ? "전환 중..."
                            : getPublishStatusLabel("PUBLISHED")}
                        </span>
                      </div>
                      {!upload.canManage && (
                        <span className="text-xs text-gray-400">
                          저장자만 변경 가능
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
