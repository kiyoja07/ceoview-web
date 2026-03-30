"use client";

import Link from "next/link";
import type { PendingRequestSummary } from "@/types/company/change-request";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type EmployeeRow = {
  id: string;
  employeeCode: string | null;
  name: string;
  residentNumber: string | null;
  department: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  resignDate: string | null;
  phone: string | null;
  email: string | null;
  publishStatus?: "SAVED" | "PUBLISHED";
  createdAt: string;
  pendingRequest?: PendingRequestSummary | null;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
};

type EmployeeTableProps = {
  employees: EmployeeRow[];
  total: number;
  page: number;
  totalPages: number;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  search: string;
  listLoading: boolean;
  listError: string | null;
  deleteLoadingId: string | null;
  onDelete: (employeeId: string, name: string) => void;
  onPageChange: (page: number) => void;
  detailBaseUrl?: string;
  /** Publication toggle callbacks (optional – only rendered when provided) */
  onPublishToggle?: (
    employeeId: string,
    newStatus: "SAVED" | "PUBLISHED",
  ) => void;
  publishLoading?: boolean;
  publishedCount?: number;
  savedCount?: number;
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(value: string | null) {
  if (!value) return "-";
  return value;
}

function getBirthDate(residentNumber: string | null): string {
  if (!residentNumber) return "-";
  const digits = residentNumber.replace(/\D/g, "");
  if (digits.length < 6) return "-";
  const yy = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  return `${yy}-${mm}-${dd}`;
}

function getEmployeeStatus(
  hireDate: string | null,
  resignDate: string | null,
): string {
  const today = new Date().toISOString().slice(0, 10);
  if (resignDate) return resignDate <= today ? "퇴사완료" : "퇴사예정";
  if (hireDate) return hireDate <= today ? "재직중" : "입사예정";
  return "-";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "재직중":
      return "text-emerald-600 bg-emerald-50";
    case "입사예정":
      return "text-blue-600 bg-blue-50";
    case "퇴사완료":
      return "text-gray-500 bg-gray-100";
    case "퇴사예정":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-400";
  }
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function EmployeeTable({
  employees,
  total,
  page,
  totalPages,
  searchInput,
  onSearchInputChange,
  onSearch,
  search,
  listLoading,
  listError,
  deleteLoadingId,
  onDelete,
  onPageChange,
  detailBaseUrl,
  onPublishToggle,
  publishLoading,
  publishedCount,
  savedCount,
}: EmployeeTableProps) {
  return (
    <>
      {/* Search / stats bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder="이름, 사원코드, 부서 검색"
            className="text-gray-700 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            검색
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {publishedCount != null && savedCount != null && (
            <span className="text-xs text-gray-500">
              공개 {publishedCount}명 · 비공개 {savedCount}명
            </span>
          )}
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            총 {total}명
          </span>
        </div>
      </div>

      {listLoading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">직원 목록을 불러오는 중...</p>
        </div>
      ) : listError ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-red-600">{listError}</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">
            {search
              ? "검색 결과가 없습니다."
              : "등록된 직원이 없습니다. 직원을 등록해주세요."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">사원코드</th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-left">재직상태</th>
                    <th className="px-4 py-3 text-left">생년월일</th>
                    <th className="px-4 py-3 text-left">입사일</th>
                    <th className="px-4 py-3 text-left">퇴사일</th>
                    <th className="px-4 py-3 text-left">연락처</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    {onPublishToggle && (
                      <th className="px-4 py-3 text-center">공개상태</th>
                    )}
                    <th className="px-4 py-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {emp.employeeCode ?? "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {detailBaseUrl && (
                          <Link
                            href={`${detailBaseUrl}/${emp.id}`}
                            className=" hover:underline"
                          >
                            {emp.name}
                          </Link>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {(() => {
                          const status = getEmployeeStatus(
                            emp.hireDate,
                            emp.resignDate,
                          );
                          return (
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(status)}`}
                            >
                              {status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getBirthDate(emp.residentNumber)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(emp.hireDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(emp.resignDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {emp.phone ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {emp.email ?? "-"}
                      </td>
                      {onPublishToggle && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={publishLoading}
                            onClick={() =>
                              onPublishToggle(
                                emp.id,
                                emp.publishStatus === "PUBLISHED"
                                  ? "SAVED"
                                  : "PUBLISHED",
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              emp.publishStatus === "PUBLISHED"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                emp.publishStatus === "PUBLISHED"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {emp.publishStatus === "PUBLISHED"
                              ? "공개"
                              : "비공개"}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {detailBaseUrl && (
                            <Link
                              href={`${detailBaseUrl}/${emp.id}`}
                              className="inline-flex rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                            >
                              상세
                            </Link>
                          )}
                          {onDelete && emp.publishStatus !== "PUBLISHED" && (
                            <button
                              type="button"
                              disabled={deleteLoadingId === emp.id}
                              onClick={() => onDelete(emp.id, emp.name)}
                              className="inline-flex rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleteLoadingId === emp.id
                                ? "삭제중..."
                                : "삭제"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
