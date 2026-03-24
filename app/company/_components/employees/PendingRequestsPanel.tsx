import Link from "next/link";
import type { PendingRequestSummary } from "@/types/company/change-request";
import { getPendingRequestLabel, resolvePendingIncomeType } from "./utils";
import type { DashboardEmployeeRow } from "./types";

type PendingRequestsPanelProps = {
  pendingCreateRequests: PendingRequestSummary[];
  pendingUpdateRows: DashboardEmployeeRow[];
};

export default function PendingRequestsPanel({
  pendingCreateRequests,
  pendingUpdateRows,
}: PendingRequestsPanelProps) {
  if (pendingCreateRequests.length === 0 && pendingUpdateRows.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-amber-950">
            처리 대기 중인 요청
          </h2>
          <p className="mt-1 text-sm text-amber-900/80">
            세무대리인 검토가 필요한 요청입니다. 승인되면 대시보드에 자동
            반영됩니다.
          </p>
        </div>
        <Link
          href="/company/requests"
          className="inline-flex items-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          전체 요청 보기
        </Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {pendingCreateRequests.map((request) => {
          const payload = request.requestedPayload as {
            name?: string | null;
          };

          return (
            <div
              key={request.id}
              className="rounded-2xl border border-amber-200 bg-white/80 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  신규 등록
                </span>
                <span className="text-xs text-amber-800">
                  {resolvePendingIncomeType(request)}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">
                {payload.name || "이름 없음"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                요청일 {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
          );
        })}

        {pendingUpdateRows.map((employee) => (
          <div
            key={employee.id}
            className="rounded-2xl border border-amber-200 bg-white/80 p-4"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {employee.incomeTypeLabel}
              </span>
              <span className="text-xs text-amber-800">
                {getPendingRequestLabel(employee.pendingRequest)}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {employee.name}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              요청일{" "}
              {employee.pendingRequest
                ? new Date(employee.pendingRequest.createdAt).toLocaleString()
                : "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
