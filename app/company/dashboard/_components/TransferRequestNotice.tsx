import { formatOrganizationNumber } from "./formatters";
import type { PendingTransferRequest } from "./types";

type TransferRequestNoticeProps = {
  pendingRequest: PendingTransferRequest | null;
  accepting: boolean;
  rejecting: boolean;
  transferMessage: string | null;
  onAcceptTransfer: () => void;
  onRejectTransfer: () => void;
};

export function TransferRequestNotice({
  pendingRequest,
  accepting,
  rejecting,
  transferMessage,
  onAcceptTransfer,
  onRejectTransfer,
}: TransferRequestNoticeProps) {
  if (pendingRequest) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-amber-900">
          {pendingRequest.fromOrganization
            ? "담당 세무대리인 변경 요청"
            : "담당 세무대리인 연결 요청"}
        </p>
        <p className="mt-2 text-sm text-amber-800">
          {pendingRequest.fromOrganization
            ? `현재 담당: ${pendingRequest.fromOrganization.organizationName || formatOrganizationNumber(pendingRequest.fromOrganization.organizationNumber)}`
            : "현재 담당: 없음"}
        </p>
        <p className="mt-1 text-sm text-amber-800">
          요청한 세무대리인:{" "}
          {pendingRequest.toOrganization.organizationName ||
            formatOrganizationNumber(
              pendingRequest.toOrganization.organizationNumber,
            )}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={accepting || rejecting}
            onClick={onAcceptTransfer}
            className="inline-flex items-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {accepting ? "수락 처리 중..." : "요청 수락"}
          </button>
          <button
            type="button"
            disabled={accepting || rejecting}
            onClick={onRejectTransfer}
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rejecting ? "거절 처리 중..." : "거절"}
          </button>
        </div>
        {transferMessage && (
          <p className="mt-3 text-sm text-amber-900">{transferMessage}</p>
        )}
      </div>
    );
  }

  if (!transferMessage) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      {transferMessage}
    </div>
  );
}
