"use client";

import { useState } from "react";

type Props = {
  employeeName: string;
  companyId: string;
  employeeId: string;
  onDeleted: () => void;
  onClose: () => void;
  onAuthError: (status: number) => boolean;
};

export default function DeleteConfirmModal({
  employeeName,
  companyId,
  employeeId,
  onDeleted,
  onClose,
  onAuthError,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/agent/company/${companyId}/employee`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (onAuthError(res.status)) return;
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "삭제에 실패했습니다.");
      }
      onDeleted();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "삭제에 실패했습니다.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900">직원 삭제</h3>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{employeeName}</span>{" "}
          직원을 삭제하시겠습니까?
          <br />
          <span className="text-red-500">
            삭제된 데이터는 복구할 수 없습니다.
          </span>
        </p>

        {deleteError && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {deleteError}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            disabled={deleting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
