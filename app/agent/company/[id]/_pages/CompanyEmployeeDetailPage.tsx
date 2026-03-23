"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { EmployeeFullDetail } from "@/app/_components/EmployeeDetailModal";
import EmployeeViewMode from "../employee/[employeeId]/_components/EmployeeViewMode";
import EmployeeEditMode from "../employee/[employeeId]/_components/EmployeeEditMode";
import DeleteConfirmModal from "../employee/[employeeId]/_components/DeleteConfirmModal";
import type { CompanyChangeRequestItem } from "@/types/company/change-request";

const REQUEST_FIELD_LABELS = [
  ["employeeCode", "사원코드"],
  ["name", "이름"],
  ["residentNumber", "주민등록번호"],
  ["department", "부서"],
  ["positionTitle", "직책"],
  ["email", "이메일"],
  ["phone", "휴대폰"],
  ["hireDate", "입사일"],
  ["resignDate", "퇴사일"],
  ["zipcode", "우편번호"],
  ["address", "주소"],
  ["addressDetail", "상세주소"],
] as const;

const REQUEST_COMPARISON_FIELDS = [
  ...REQUEST_FIELD_LABELS,
  ["bankAccounts", "급여계좌"],
] as const;

function applyRequestPayload(
  employee: EmployeeFullDetail,
  requestItem: CompanyChangeRequestItem | null,
) {
  if (!requestItem || requestItem.action !== "UPDATE") {
    return employee;
  }

  const payload = requestItem.requestedPayload as Record<string, unknown>;
  return {
    ...employee,
    employeeCode:
      typeof payload.employeeCode === "string"
        ? payload.employeeCode
        : employee.employeeCode,
    name: typeof payload.name === "string" ? payload.name : employee.name,
    residentNumber:
      typeof payload.residentNumber === "string"
        ? payload.residentNumber
        : employee.residentNumber,
    department:
      typeof payload.department === "string"
        ? payload.department
        : employee.department,
    positionTitle:
      typeof payload.positionTitle === "string"
        ? payload.positionTitle
        : employee.positionTitle,
    email: typeof payload.email === "string" ? payload.email : employee.email,
    phone: typeof payload.phone === "string" ? payload.phone : employee.phone,
    hireDate:
      typeof payload.hireDate === "string"
        ? payload.hireDate
        : employee.hireDate,
    resignDate:
      typeof payload.resignDate === "string"
        ? payload.resignDate
        : employee.resignDate,
    zipcode:
      typeof payload.zipcode === "string" ? payload.zipcode : employee.zipcode,
    address:
      typeof payload.address === "string" ? payload.address : employee.address,
    addressDetail:
      typeof payload.addressDetail === "string"
        ? payload.addressDetail
        : employee.addressDetail,
    bankAccounts: Array.isArray(payload.bankAccounts)
      ? (payload.bankAccounts as EmployeeFullDetail["bankAccounts"])
      : employee.bankAccounts,
  };
}

function formatRequestValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || "-";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "예" : "아니오";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return "-";
        const bankAccount = item as {
          bankName?: string;
          accountNumber?: string;
          accountHolder?: string;
        };
        return [
          bankAccount.bankName || "-",
          bankAccount.accountNumber || "-",
          bankAccount.accountHolder || "-",
        ].join(" / ");
      })
      .join(", ");
  }
  return "-";
}

function getChangedRequestEntries(requestItem: CompanyChangeRequestItem) {
  const currentSnapshot =
    (requestItem.currentSnapshot as Record<string, unknown> | null) ?? {};
  const requestedPayload =
    (requestItem.requestedPayload as Record<string, unknown> | null) ?? {};

  return REQUEST_COMPARISON_FIELDS.map(([key, label]) => {
    const currentValue = formatRequestValue(currentSnapshot[key]);
    const requestedValue = formatRequestValue(requestedPayload[key]);

    return {
      key,
      label,
      currentValue,
      requestedValue,
      changed: currentValue !== requestedValue,
    };
  }).filter((entry) => entry.changed);
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function AgentEmployeeDetailPage() {
  const params = useParams<{ id: string; employeeId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = params?.id;
  const employeeId = params?.employeeId;
  const requestId = searchParams.get("requestId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeFullDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [requestItem, setRequestItem] =
    useState<CompanyChangeRequestItem | null>(null);

  const handleAuthError = useCallback(
    (status: number) => {
      if (status === 401) {
        router.replace("/agent/auth/login");
        return true;
      }
      if (status === 403) {
        router.replace("/agent/auth/organization");
        return true;
      }
      return false;
    },
    [router],
  );

  // Fetch detail on mount
  useEffect(() => {
    if (!companyId || !employeeId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [employeeRes, requestRes] = await Promise.all([
          fetch(`/api/agent/company/${companyId}/employee/${employeeId}`, {
            cache: "no-store",
          }),
          requestId
            ? fetch(`/api/agent/company/requests/${requestId}`, {
                cache: "no-store",
              })
            : Promise.resolve(null),
        ]);
        if (handleAuthError(employeeRes.status)) return;
        if (requestRes?.status && handleAuthError(requestRes.status)) return;
        const body = await employeeRes.json();
        if (!employeeRes.ok)
          throw new Error(body?.error || "직원 정보 조회에 실패했습니다.");
        if (cancelled) return;
        const detail = body as EmployeeFullDetail;
        if (requestRes?.ok) {
          const requestBody = (await requestRes.json()) as {
            item: CompanyChangeRequestItem;
          };
          setRequestItem(requestBody.item);
          setEmployee(detail);
        } else {
          setEmployee(detail);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "직원 정보 조회에 실패했습니다.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, employeeId, handleAuthError, requestId]);

  const handleApproveRequest = useCallback(async () => {
    if (!requestItem || !requestId || !companyId || !employeeId || !employee) {
      return;
    }

    if (requestItem.action === "DELETE") {
      setDeleteConfirmOpen(true);
      return;
    }

    if (requestItem.action !== "UPDATE") {
      return;
    }

    setApproving(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/agent/company/${companyId}/employee/${employeeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(requestItem.requestedPayload as Record<string, unknown>),
            requestId,
          }),
        },
      );

      if (handleAuthError(res.status)) return;

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "요청 승인에 실패했습니다.");
      }

      router.replace("/agent/company/requests");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "요청 승인에 실패했습니다.",
      );
    } finally {
      setApproving(false);
    }
  }, [
    companyId,
    employee,
    employeeId,
    handleAuthError,
    requestId,
    requestItem,
    router,
  ]);

  const changedRequestEntries =
    requestItem?.action === "UPDATE"
      ? getChangedRequestEntries(requestItem)
      : [];

  // ── Main render ──
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        {/* Top bar */}
        <div className="mb-6 space-y-1">
          <button
            type="button"
            onClick={() => router.push(`/agent/company/${companyId}/employees`)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-base font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            직원 목록으로
          </button>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          {requestItem && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              직원{" "}
              {requestItem.action === "DELETE"
                ? "삭제"
                : requestItem.action === "UPDATE"
                  ? "수정"
                  : "등록"}{" "}
              요청이 접수 되었습니다.
              <div className="mt-1 text-xs text-amber-700">
                요청자 {requestItem.requestedByCompanyUser.name} · 접수일{" "}
                {new Date(requestItem.createdAt).toLocaleString()}
              </div>
              {requestItem.action === "UPDATE" && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      제출 시점 내용
                    </h3>
                    <dl className="mt-3 space-y-2">
                      {changedRequestEntries.map((entry) => (
                        <div
                          key={`current-${entry.key}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <dt className="text-xs font-medium text-gray-500">
                            {entry.label}
                          </dt>
                          <dd className="text-right text-sm text-gray-900">
                            {entry.currentValue}
                          </dd>
                        </div>
                      ))}
                      {changedRequestEntries.length === 0 && (
                        <div className="text-sm text-gray-500">
                          비교 가능한 변경 항목이 없습니다.
                        </div>
                      )}
                    </dl>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      요청 내용
                    </h3>
                    <dl className="mt-3 space-y-2">
                      {changedRequestEntries.map((entry) => (
                        <div
                          key={`requested-${entry.key}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <dt className="text-xs font-medium text-gray-500">
                            {entry.label}
                          </dt>
                          <dd className="text-right text-sm font-medium text-emerald-900">
                            {entry.requestedValue}
                          </dd>
                        </div>
                      ))}
                      {changedRequestEntries.length === 0 && (
                        <div className="text-sm text-gray-500">
                          비교 가능한 변경 항목이 없습니다.
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}
              {requestItem.action === "DELETE" && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-900">
                  회사에서 해당 직원을 삭제 요청했습니다. 아래 상세 정보와 함께
                  삭제 여부를 최종 검수하세요.
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleApproveRequest()}
                  disabled={approving}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {approving
                    ? requestItem.action === "DELETE"
                      ? "승인 준비 중..."
                      : "승인 처리 중..."
                    : requestItem.action === "DELETE"
                      ? "삭제 승인"
                      : "요청대로 승인"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const reason = window.prompt("반려 사유를 입력해주세요.");
                    if (!reason?.trim()) return;
                    const res = await fetch(
                      `/api/agent/company/requests/${requestItem.id}/reject`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resolutionComment: reason.trim(),
                        }),
                      },
                    );
                    if (res.ok) {
                      router.replace("/agent/company/requests");
                    }
                  }}
                  disabled={approving}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  반려
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-500">
                직원 정보를 불러오는 중...
              </p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : editing && employee && companyId && employeeId ? (
            <EmployeeEditMode
              employee={applyRequestPayload(employee, requestItem)}
              companyId={companyId}
              employeeId={employeeId}
              requestId={requestId}
              onSave={(updated) => {
                setEmployee(updated);
                setEditing(false);
                if (requestId) {
                  router.replace("/agent/company/requests");
                }
              }}
              onCancel={() => setEditing(false)}
              onAuthError={handleAuthError}
            />
          ) : employee ? (
            <EmployeeViewMode
              employee={employee}
              onEdit={() => {
                if (requestItem?.action === "DELETE") return;
                setEditing(true);
              }}
              onDelete={() => setDeleteConfirmOpen(true)}
            />
          ) : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && employee && companyId && employeeId && (
        <DeleteConfirmModal
          employeeName={employee.name}
          companyId={companyId}
          employeeId={employeeId}
          requestId={requestId}
          onDeleted={() =>
            router.replace(
              requestId
                ? "/agent/company/requests"
                : `/agent/company/${companyId}/employees`,
            )
          }
          onClose={() => setDeleteConfirmOpen(false)}
          onAuthError={handleAuthError}
        />
      )}
    </div>
  );
}
