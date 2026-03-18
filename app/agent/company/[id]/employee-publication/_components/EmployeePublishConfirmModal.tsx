type PublishStatus = "SAVED" | "PUBLISHED";

export type EmployeePublishConfirmModalProps = {
  targetLabel: string;
  publishStatus: PublishStatus;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function EmployeePublishConfirmModal({
  targetLabel,
  publishStatus,
  onConfirm,
  onCancel,
}: EmployeePublishConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-gray-900">
          상태 변경 확인
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium text-gray-800">{targetLabel}</span>
          {" 항목을 "}
          {publishStatus === "PUBLISHED" ? (
            <span className="font-semibold text-blue-700">PUBLISHED</span>
          ) : (
            <span className="font-semibold text-amber-700">SAVED</span>
          )}
          {" 상태로 변경하시겠습니까?"}
        </p>
        {publishStatus === "PUBLISHED" && (
          <p className="mt-2 text-xs text-blue-600">
            PUBLISHED로 변경하면 거래처에서 해당 직원 정보를 조회할 수 있습니다.
          </p>
        )}
        {publishStatus === "SAVED" && (
          <p className="mt-2 text-xs text-amber-600">
            SAVED로 변경하면 거래처에서 해당 직원 정보를 조회할 수 없게 됩니다.
          </p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
              publishStatus === "PUBLISHED"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            변경
          </button>
        </div>
      </div>
    </div>
  );
}
