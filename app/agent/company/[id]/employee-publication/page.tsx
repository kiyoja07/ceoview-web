"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EmployeePublishConfirmModal from "./_components/EmployeePublishConfirmModal";

// ── Types ──

type IncomeType =
  | "EARNED_INCOME"
  | "BUSINESS_INCOME"
  | "OTHER_INCOME"
  | "OTHER_INCOME_LABOR";

type PublishStatus = "SAVED" | "PUBLISHED";

type EmployeeRow = {
  id: string;
  employeeCode: string | null;
  name: string;
  department: string | null;
  positionTitle: string | null;
  hireDate: string | null;
  resignDate: string | null;
  publishStatus: PublishStatus;
  createdAt: string;
};

type IncomeTypeGroup = {
  incomeType: IncomeType;
  incomeTypeLabel: string;
  employees: EmployeeRow[];
  totalCount: number;
  savedCount: number;
  publishedCount: number;
};

type SnapshotResponse = {
  success: boolean;
  groups: IncomeTypeGroup[];
  totalCount: number;
  savedCount: number;
  publishedCount: number;
};

type CompanyInfo = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

type PendingAction =
  | {
      kind: "individual";
      employeeId: string;
      employeeName: string;
      incomeType: IncomeType;
      publishStatus: PublishStatus;
    }
  | {
      kind: "bulk";
      incomeType: IncomeType;
      incomeTypeLabel: string;
      publishStatus: PublishStatus;
      count: number;
    };

// ── Helpers ──

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

// ── Component ──

export default function AgentCompanyEmployeePublicationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params?.id;

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [data, setData] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<IncomeType>("EARNED_INCOME");

  // ── Load data ──
  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [companyRes, statusRes] = await Promise.all([
          fetch(`/api/agent/company/${companyId}/info`, { cache: "no-store" }),
          fetch(`/api/agent/company/${companyId}/employee-publication`, {
            cache: "no-store",
          }),
        ]);

        if (companyRes.status === 401 || statusRes.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (companyRes.status === 403 || statusRes.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }

        if (!companyRes.ok) {
          const body = await companyRes.json().catch(() => null);
          setError(body?.error || "거래처 정보를 불러오지 못했습니다.");
          return;
        }
        if (!statusRes.ok) {
          const body = await statusRes.json().catch(() => null);
          setError(body?.error || "발행 상태를 불러오지 못했습니다.");
          return;
        }

        setCompany((await companyRes.json()) as CompanyInfo);
        setData((await statusRes.json()) as SnapshotResponse);
      } catch {
        setError("직원 발행 관리 화면을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [companyId, router]);

  // ── Run action ──
  async function runAction(action: PendingAction) {
    if (!companyId) return;
    setActionLoading(true);
    setError(null);

    try {
      const bodyPayload =
        action.kind === "individual"
          ? {
              action: "setEmployeeStatus",
              employeeId: action.employeeId,
              incomeType: action.incomeType,
              publishStatus: action.publishStatus,
            }
          : {
              action: "setBulkStatus",
              incomeType: action.incomeType,
              publishStatus: action.publishStatus,
            };

      const res = await fetch(
        `/api/agent/company/${companyId}/employee-publication`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        },
      );

      const body = (await res.json().catch(() => null)) as
        | SnapshotResponse
        | { error?: string }
        | null;

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        const message =
          body && "error" in body
            ? (body.error ?? "권한이 없습니다.")
            : "권한이 없습니다.";
        if (message.includes("소속 에이전트 조직")) {
          router.replace("/agent/auth/organization");
          return;
        }
        setError(message);
        return;
      }
      if (!res.ok) {
        setError(
          body && "error" in body
            ? (body.error ?? "처리에 실패했습니다.")
            : "처리에 실패했습니다.",
        );
        return;
      }

      setData(body as SnapshotResponse);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Derived state ──
  const titleCompany = useMemo(() => {
    if (!company) return "";
    const number = formatBusinessNumber(company.businessNumber);
    return company.businessName
      ? `${company.businessName} (${number})`
      : number;
  }, [company]);

  const activeGroup = useMemo(() => {
    return data?.groups.find((g) => g.incomeType === activeTab) ?? null;
  }, [data, activeTab]);

  const TABS: { value: IncomeType; label: string }[] = [
    { value: "EARNED_INCOME", label: "근로소득" },
    { value: "BUSINESS_INCOME", label: "사업소득" },
    { value: "OTHER_INCOME", label: "기타소득" },
    { value: "OTHER_INCOME_LABOR", label: "일용소득" },
  ];

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            직원 발행 관리
          </h1>
          {titleCompany && (
            <p className="mt-1 text-sm text-gray-500">{titleCompany}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            직원별로 SAVED/PUBLISHED를 선택할 수 있습니다.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            SAVED는 agent만 조회 가능, PUBLISHED만 company에 노출됩니다.
          </p>
        </div>

        {/* Action links */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/agent/employees/new?companyId=${companyId}`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            직원 엑셀 등록
          </Link>
          <Link
            href={`/agent/company/${companyId}/employee`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            직원 관리 화면
          </Link>
          {data && (
            <div className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
              총 {data.totalCount}명 · PUBLISHED {data.publishedCount}명 · SAVED{" "}
              {data.savedCount}명
            </div>
          )}
        </div>

        {/* Loading / Error / Content */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              직원 발행 상태를 불러오는 중...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !data || data.totalCount === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">등록된 직원이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* Income type tabs */}
            <div className="mb-5 flex gap-4 rounded-xl bg-gray-100 p-1">
              {TABS.map((tab) => {
                const group = data.groups.find(
                  (g) => g.incomeType === tab.value,
                );
                const count = group?.totalCount ?? 0;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      activeTab === tab.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1 text-xs ${
                        activeTab === tab.value
                          ? "text-gray-500"
                          : "text-gray-400"
                      }`}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active group content */}
            {activeGroup && activeGroup.totalCount > 0 && (
              <>
                {/* Bulk action bar */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {activeGroup.incomeTypeLabel} 직원 {activeGroup.totalCount}
                    명 (SAVED {activeGroup.savedCount}명 / PUBLISHED{" "}
                    {activeGroup.publishedCount}명)
                  </span>
                  <div className="ml-auto flex gap-2">
                    {activeGroup.publishedCount > 0 && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          setPendingAction({
                            kind: "bulk",
                            incomeType: activeGroup.incomeType,
                            incomeTypeLabel: activeGroup.incomeTypeLabel,
                            publishStatus: "SAVED",
                            count: activeGroup.publishedCount,
                          })
                        }
                        className="inline-flex rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        전체 SAVED 전환
                      </button>
                    )}
                    {activeGroup.savedCount > 0 && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          setPendingAction({
                            kind: "bulk",
                            incomeType: activeGroup.incomeType,
                            incomeTypeLabel: activeGroup.incomeTypeLabel,
                            publishStatus: "PUBLISHED",
                            count: activeGroup.savedCount,
                          })
                        }
                        className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        전체 PUBLISHED 전환
                      </button>
                    )}
                  </div>
                </div>

                {/* Employee table */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                          <th className="px-4 py-3 text-left">직원코드</th>
                          <th className="px-4 py-3 text-left">이름</th>
                          <th className="px-4 py-3 text-left">부서</th>
                          <th className="px-4 py-3 text-left">직책</th>
                          <th className="px-4 py-3 text-left">입사일</th>
                          <th className="px-4 py-3 text-left">퇴사일</th>
                          <th className="px-4 py-3 text-left">상태</th>
                          <th className="px-4 py-3 text-left">상태 선택</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeGroup.employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50/70">
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                              {emp.employeeCode || "-"}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {emp.name}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {emp.department || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {emp.positionTitle || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {emp.hireDate || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {emp.resignDate || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {emp.publishStatus === "PUBLISHED" ? (
                                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                  PUBLISHED
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  SAVED
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading ||
                                    emp.publishStatus === "SAVED"
                                  }
                                  onClick={() =>
                                    setPendingAction({
                                      kind: "individual",
                                      employeeId: emp.id,
                                      employeeName: emp.name,
                                      incomeType: activeGroup.incomeType,
                                      publishStatus: "SAVED",
                                    })
                                  }
                                  className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                    emp.publishStatus === "SAVED"
                                      ? "bg-amber-200 text-amber-800"
                                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  SAVED
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    actionLoading ||
                                    emp.publishStatus === "PUBLISHED"
                                  }
                                  onClick={() =>
                                    setPendingAction({
                                      kind: "individual",
                                      employeeId: emp.id,
                                      employeeName: emp.name,
                                      incomeType: activeGroup.incomeType,
                                      publishStatus: "PUBLISHED",
                                    })
                                  }
                                  className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                    emp.publishStatus === "PUBLISHED"
                                      ? "bg-blue-200 text-blue-800"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  PUBLISHED
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeGroup && activeGroup.totalCount === 0 && (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                <p className="text-sm text-gray-500">
                  {activeGroup.incomeTypeLabel} 유형의 등록된 직원이 없습니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm modal */}
      {pendingAction && (
        <EmployeePublishConfirmModal
          targetLabel={
            pendingAction.kind === "individual"
              ? pendingAction.employeeName
              : `${pendingAction.incomeTypeLabel} 전체 ${pendingAction.count}명`
          }
          publishStatus={pendingAction.publishStatus}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            const action = pendingAction;
            setPendingAction(null);
            void runAction(action);
          }}
        />
      )}
    </div>
  );
}
