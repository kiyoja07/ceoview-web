"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EmployeeFullDetail } from "@/app/_components/EmployeeDetailModal";
import EmployeeViewMode from "../employee/[employeeId]/_components/EmployeeViewMode";
import EmployeeEditMode from "../employee/[employeeId]/_components/EmployeeEditMode";
import DeleteConfirmModal from "../employee/[employeeId]/_components/DeleteConfirmModal";

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function AgentEmployeeDetailPage() {
  const params = useParams<{ id: string; employeeId: string }>();
  const router = useRouter();
  const companyId = params?.id;
  const employeeId = params?.employeeId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeFullDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
        const employeeRes = await fetch(
          `/api/agent/company/${companyId}/employee/${employeeId}`,
          { cache: "no-store" },
        );
        if (handleAuthError(employeeRes.status)) return;
        const body = await employeeRes.json();
        if (!employeeRes.ok)
          throw new Error(body?.error || "직원 정보 조회에 실패했습니다.");
        if (cancelled) return;
        setEmployee(body as EmployeeFullDetail);
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
  }, [companyId, employeeId, handleAuthError]);

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
              employee={employee}
              companyId={companyId}
              employeeId={employeeId}
              onSave={(updated) => {
                setEmployee(updated);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
              onAuthError={handleAuthError}
            />
          ) : employee ? (
            <EmployeeViewMode
              employee={employee}
              onEdit={() => setEditing(true)}
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
          onDeleted={() =>
            router.replace(`/agent/company/${companyId}/employees`)
          }
          onClose={() => setDeleteConfirmOpen(false)}
          onAuthError={handleAuthError}
        />
      )}
    </div>
  );
}
