"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatBusinessNumber } from "@/app/lib/formatters";
import EmployeeTable from "@/app/_components/EmployeeTable";
import type { EmployeeRow } from "@/app/_components/EmployeeTable";
import { EMPLOYEE_INCOME_TYPE_OPTIONS } from "@/catalogs/ko/employee";
import EmployeePublishConfirmModal from "./_components/EmployeePublishConfirmModal";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type PublishStatus = "SAVED" | "PUBLISHED";

type EmployeeListResponse = {
  success: boolean;
  employees: EmployeeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
      publishStatus: PublishStatus;
    }
  | {
      kind: "bulk";
      publishStatus: PublishStatus;
      count: number;
    };

// ────────────────────────────────────────────────────────────
// Income type tabs
// ────────────────────────────────────────────────────────────

type IncomeType = (typeof EMPLOYEE_INCOME_TYPE_OPTIONS)[number]["value"];

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function AgentCompanyEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params?.id;

  // Shared state
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  // Employee list state
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("EARNED_INCOME");

  // Publication state
  const [publishLoading, setPublishLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  // ── Auth guard helper ──
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

  // ── Load company info ──
  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/agent/company/${companyId}/info`, {
          cache: "no-store",
        });
        if (handleAuthError(res.status)) return;
        if (res.ok) {
          setCompany((await res.json()) as CompanyInfo);
        }
      } catch {
        // silent
      }
    };
    void load();
  }, [companyId, handleAuthError]);

  // ── Load employee list ──
  // 삭제·공개 상태 변경 후 목록을 다시 불러올 때 증가시킨다.
  const [listReloadKey, setListReloadKey] = useState(0);
  const reloadEmployees = useCallback(() => {
    setListReloadKey((key) => key + 1);
  }, []);

  // 조회 조건이 바뀌면 렌더 중에 로딩 상태를 초기화
  const listRequestKey = companyId
    ? `${companyId}|${page}|${search}|${incomeType}|${listReloadKey}`
    : null;
  const [prevListRequestKey, setPrevListRequestKey] = useState<string | null>(
    null,
  );
  if (listRequestKey !== prevListRequestKey) {
    setPrevListRequestKey(listRequestKey);
    if (listRequestKey) {
      setListLoading(true);
      setListError(null);
    }
  }

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "50",
          incomeType,
        });
        if (search) params.set("search", search);

        const res = await fetch(
          `/api/agent/company/${companyId}/employee?${params}`,
          { cache: "no-store" },
        );
        if (cancelled) return;

        if (handleAuthError(res.status)) return;

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          if (cancelled) return;
          setListError(body?.error || "직원 목록을 불러오지 못했습니다.");
          return;
        }

        const data = (await res.json()) as EmployeeListResponse;
        if (cancelled) return;
        setEmployees(data.employees);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        if (!cancelled) setListError("직원 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [companyId, page, search, incomeType, handleAuthError, listReloadKey]);

  // ── Switch income type ──
  const handleIncomeTypeChange = (type: IncomeType) => {
    setIncomeType(type);
    setPage(1);
    setSearch("");
    setSearchInput("");
  };

  // ── Search submit ──
  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  // ── Delete employee ──
  const handleDelete = async (employeeId: string, name: string) => {
    if (!companyId) return;
    const emp = employees.find((e) => e.id === employeeId);
    if (emp?.publishStatus === "PUBLISHED") {
      alert(
        "공개 상태인 직원은 삭제할 수 없습니다. 비공개로 변경 후 삭제해주세요.",
      );
      return;
    }
    if (!confirm(`"${name}" 직원을 삭제하시겠습니까?`)) return;

    setDeleteLoadingId(employeeId);
    try {
      const res = await fetch(`/api/agent/company/${companyId}/employee`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      if (handleAuthError(res.status)) return;

      if (res.ok) {
        reloadEmployees();
      } else {
        const body = await res.json().catch(() => null);
        alert(body?.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // ── Run publish action ──
  const runPublishAction = useCallback(
    async (action: PendingAction) => {
      if (!companyId) return;
      setPublishLoading(true);

      try {
        const bodyPayload =
          action.kind === "individual"
            ? {
                action: "setEmployeeStatus",
                employeeId: action.employeeId,
                incomeType,
                publishStatus: action.publishStatus,
              }
            : {
                action: "setBulkStatus",
                incomeType,
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

        if (handleAuthError(res.status)) return;

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          alert(body?.error || "상태 변경에 실패했습니다.");
          return;
        }

        // Reload list to get updated publishStatus
        reloadEmployees();
      } catch {
        alert("서버 연결에 실패했습니다.");
      } finally {
        setPublishLoading(false);
      }
    },
    [companyId, incomeType, handleAuthError, reloadEmployees],
  );

  // ── Handle individual publish toggle (called from table row) ──
  const handlePublishToggle = useCallback(
    (employeeId: string, newStatus: "SAVED" | "PUBLISHED") => {
      const emp = employees.find((e) => e.id === employeeId);
      setPendingAction({
        kind: "individual",
        employeeId,
        employeeName: emp?.name ?? "",
        publishStatus: newStatus,
      });
    },
    [employees],
  );

  // ── Publication counts ──
  const publishedCount = useMemo(
    () => employees.filter((e) => e.publishStatus === "PUBLISHED").length,
    [employees],
  );
  const savedCount = useMemo(
    () => employees.filter((e) => e.publishStatus !== "PUBLISHED").length,
    [employees],
  );

  // ── Title ──
  const titleCompany = company
    ? company.businessName
      ? `${company.businessName} (${formatBusinessNumber(company.businessNumber)})`
      : formatBusinessNumber(company.businessNumber)
    : "";

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            거래처 지급 대상자 관리
          </h1>
          {titleCompany && (
            <p className="mt-1 text-sm text-gray-500">{titleCompany}</p>
          )}
        </div>

        {/* Income type tabs */}
        <div className="mb-3 flex gap-4 rounded-xl bg-gray-100 p-1">
          {EMPLOYEE_INCOME_TYPE_OPTIONS.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleIncomeTypeChange(type.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                incomeType === type.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 border border-gray-300 "
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <Link
            href={`/agent/company/${companyId}/employees/upload`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            지급 대상자 엑셀 파일 등록
          </Link>
          {/* <Link
            href={`/agent/company/${companyId}/employees/new`}
            className="inline-flex items-center rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
          >
            지급 대상자 개별 등록
          </Link> */}
          {/* Bulk publish actions */}
          <div className="ml-auto flex items-center gap-2">
            {!listLoading && employees.length > 0 && (
              <>
                {publishedCount > 0 && (
                  <button
                    type="button"
                    disabled={publishLoading}
                    onClick={() =>
                      setPendingAction({
                        kind: "bulk",
                        publishStatus: "SAVED",
                        count: publishedCount,
                      })
                    }
                    className="inline-flex rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    전체 비공개
                  </button>
                )}
                {savedCount > 0 && (
                  <button
                    type="button"
                    disabled={publishLoading}
                    onClick={() =>
                      setPendingAction({
                        kind: "bulk",
                        publishStatus: "PUBLISHED",
                        count: savedCount,
                      })
                    }
                    className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    전체 공개
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 직원 현황 ── */}
        <EmployeeTable
          employees={employees}
          total={total}
          page={page}
          totalPages={totalPages}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          search={search}
          listLoading={listLoading}
          listError={listError}
          deleteLoadingId={deleteLoadingId}
          onDelete={handleDelete}
          onPageChange={setPage}
          detailBaseUrl={`/agent/company/${companyId}/employees`}
          onPublishToggle={handlePublishToggle}
          publishLoading={publishLoading}
          publishedCount={publishedCount}
          savedCount={savedCount}
        />
      </div>

      {/* Publish confirm modal */}
      {pendingAction && (
        <EmployeePublishConfirmModal
          targetLabel={
            pendingAction.kind === "individual"
              ? pendingAction.employeeName
              : `현재 소득유형 전체 ${pendingAction.count}명`
          }
          publishStatus={pendingAction.publishStatus}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            const action = pendingAction;
            setPendingAction(null);
            void runPublishAction(action);
          }}
        />
      )}
    </div>
  );
}
