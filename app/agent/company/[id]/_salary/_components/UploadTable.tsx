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
              <th className="px-4 py-3 text-left">공개 상태</th>
              <th className="px-4 py-3 text-left">발행/업로드 일시</th>
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
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
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
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          upload.publishStatus === "PUBLISHED"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            upload.publishStatus === "PUBLISHED"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {rowBusy
                          ? "전환 중..."
                          : getPublishStatusLabel(upload.publishStatus)}
                      </button>
                      {!upload.canManage && (
                        <span className="text-xs text-gray-400">
                          저장자만 변경 가능
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-xs text-gray-500">
                    {upload.publishStatus === "PUBLISHED"
                      ? upload.publishedAt
                        ? formatDateTime(upload.publishedAt)
                        : "-"
                      : formatDateTime(upload.uploadedAt)}
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
