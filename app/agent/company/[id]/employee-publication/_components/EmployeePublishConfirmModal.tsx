"use client";

type Props = {
  targetLabel: string;
  publishStatus: "SAVED" | "PUBLISHED";
  onCancel: () => void;
  onConfirm: () => void;
};

export default function EmployeePublishConfirmModal({
  targetLabel,
  publishStatus,
  onCancel,
  onConfirm,
}: Props) {
  const isPublish = publishStatus === "PUBLISHED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">상태 변경 확인</h3>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{targetLabel}</span>
          {isPublish
            ? "을(를) PUBLISHED 상태로 변경하시겠습니까? company에서 조회할 수 있게 됩니다."
            : "을(를) SAVED 상태로 변경하시겠습니까? company에서 더 이상 조회할 수 없게 됩니다."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
              isPublish
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isPublish ? "PUBLISHED로 변경" : "SAVED로 변경"}
          </button>
        </div>
      </div>
    </div>
  );
}
