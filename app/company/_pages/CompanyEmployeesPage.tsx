"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PendingRequestSummary } from "@/types/company/change-request";
import {
  EMPLOYEE_INCOME_TYPE_LABELS,
  EMPLOYEE_INCOME_TYPE_OPTIONS,
  getEmployeeStatus,
  type CompanyEmployeeDashboardSummary,
  type EmployeeIncomeFilter,
  type EmployeeIncomeType,
  type EmployeeStatusFilter,
} from "@/types/company/employees";

type DashboardEmployeeRow = {
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
  createdAt: string;
  incomeType: EmployeeIncomeType;
  incomeTypeLabel: string;
  canViewDetail: boolean;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  pendingRequest: PendingRequestSummary | null;
};

type EmployeeListResponse = {
  employees: DashboardEmployeeRow[];
  pendingCreateRequests: PendingRequestSummary[];
  summary: CompanyEmployeeDashboardSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_FILTERS: Array<{
  value: EmployeeStatusFilter;
  label: string;
  getCount: (summary: CompanyEmployeeDashboardSummary) => number;
}> = [
  { value: "ALL", label: "전체", getCount: (summary) => summary.total },
  { value: "ACTIVE", label: "재직중", getCount: (summary) => summary.active },
  {
    value: "UPCOMING",
    label: "입사예정",
    getCount: (summary) => summary.upcoming,
  },
  {
    value: "LEAVING",
    label: "퇴사예정",
    getCount: (summary) => summary.leaving,
  },
  {
    value: "INACTIVE",
    label: "퇴사완료",
    getCount: (summary) => summary.inactive,
  },
];

function formatDate(value: string | null) {
  return value || "-";
}

function getBirthDate(residentNumber: string | null) {
  if (!residentNumber) return "-";
  const digits = residentNumber.replace(/\D/g, "");
  if (digits.length < 6) return "-";
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
}

function getStatusTone(status: string | null) {
  switch (status) {
    case "재직중":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "입사예정":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "퇴사예정":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "퇴사완료":
      return "bg-gray-100 text-gray-600 ring-gray-200";
    default:
      return "bg-gray-100 text-gray-500 ring-gray-200";
  }
}

function getIncomeTypeTone(incomeType: EmployeeIncomeType) {
  switch (incomeType) {
    case "EARNED_INCOME":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "BUSINESS_INCOME":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "OTHER_INCOME":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "OTHER_INCOME_LABOR":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-200";
  }
}

function getPendingRequestLabel(request: PendingRequestSummary | null) {
  if (!request) return null;
  if (request.action === "DELETE") return "삭제 요청 대기";
  if (request.action === "UPDATE") return "수정 요청 대기";
  return "등록 요청 대기";
}

function resolvePendingIncomeType(request: PendingRequestSummary) {
  const payload = request.requestedPayload as { incomeType?: EmployeeIncomeType };
  const incomeType =
    payload.incomeType && payload.incomeType in EMPLOYEE_INCOME_TYPE_LABELS
      ? payload.incomeType
      : "EARNED_INCOME";
  return EMPLOYEE_INCOME_TYPE_LABELS[incomeType];
}

function formatRatio(value: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export default function CompanyEmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<DashboardEmployeeRow[]>([]);
  const [pendingCreateRequests, setPendingCreateRequests] = useState<
    PendingRequestSummary[]
  >([]);
  const [summary, setSummary] = useState<CompanyEmployeeDashboardSummary | null>(
    null,
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [incomeTypeFilter, setIncomeTypeFilter] =
    useState<EmployeeIncomeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>("ALL");

  const handleAuthError = useCallback(
    (status: number) => {
      if (status === 401) {
        router.replace("/company/auth/login");
        return true;
      }
      return false;
    },
    [router],
  );

  const loadEmployees = useCallback(async () => {
    setListLoading(true);
    setListError(null);

    try {
      const meRes = await fetch("/api/company/auth/me", {
        cache: "no-store",
      });
      if (handleAuthError(meRes.status)) return;
      if (meRes.ok) {
        const me = (await meRes.json()) as { profileComplete?: boolean };
        if (!me.profileComplete) {
          router.replace("/company/auth/onboarding");
          return;
        }
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        incomeType: incomeTypeFilter,
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/company/employees?${params}`, {
        cache: "no-store",
      });
      if (handleAuthError(res.status)) return;

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setListError(body?.error || "지급 대상자 목록을 불러오지 못했습니다.");
        return;
      }

      const data = (await res.json()) as EmployeeListResponse;
      setEmployees(data.employees);
      setPendingCreateRequests(data.pendingCreateRequests ?? []);
      setSummary(data.summary);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setListError("지급 대상자 목록을 불러오지 못했습니다.");
    } finally {
      setListLoading(false);
    }
  }, [
    handleAuthError,
    incomeTypeFilter,
    page,
    router,
    search,
    statusFilter,
  ]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleIncomeTypeFilter = (value: EmployeeIncomeFilter) => {
    setIncomeTypeFilter(value);
    setPage(1);
  };

  const handleStatusFilter = (value: EmployeeStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const summaryByIncomeType = useMemo(() => {
    return new Map(
      summary?.byIncomeType.map((item) => [item.incomeType, item]) ?? [],
    );
  }, [summary]);

  const pendingUpdateRows = useMemo(() => {
    return employees.filter((employee) => employee.pendingRequest);
  }, [employees]);

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="mb-8 rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-lg shadow-emerald-200/60">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.28em] text-emerald-200 uppercase">
                Unified Employee Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                지급 대상자를 소득유형별로 한 번에 관리합니다.
              </h1>
              <p className="mt-3 text-sm leading-6 text-emerald-100/90">
                근로소득자, 사업소득자, 기타소득자, 일용소득자를 통합 조회하고
                연락처 등록 현황과 처리 대기 요청을 한 화면에서 확인할 수
                있습니다.
              </p>
            </div>

            <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-emerald-100/80">전체 지급 대상자</p>
                <p className="mt-2 text-3xl font-semibold">
                  {summary?.total.toLocaleString() ?? "-"}
                </p>
                <p className="mt-1 text-xs text-emerald-100/70">
                  재직중 {summary?.active.toLocaleString() ?? 0}명
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-emerald-100/80">연락처 등록률</p>
                <p className="mt-2 text-3xl font-semibold">
                  {summary
                    ? formatRatio(summary.withContact, summary.total)
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-emerald-100/70">
                  연락처 등록 {summary?.withContact.toLocaleString() ?? 0}명
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-emerald-100/80">처리 대기 요청</p>
                <p className="mt-2 text-3xl font-semibold">
                  {summary?.pendingRequests.toLocaleString() ?? "-"}
                </p>
                <p className="mt-1 text-xs text-emerald-100/70">
                  신규 등록 {pendingCreateRequests.length.toLocaleString()}건
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/company/employees/new"
            className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            지급 대상자 등록 요청
          </Link>
          <Link
            href="/company/requests"
            className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            요청 현황 보기
          </Link>
        </div>

        {summary && (
          <div className="mb-6 grid gap-3 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => handleIncomeTypeFilter("ALL")}
              className={`rounded-2xl border p-4 text-left transition ${
                incomeTypeFilter === "ALL"
                  ? "border-emerald-300 bg-emerald-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">통합 보기</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary.total.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                처리 대기 {summary.pendingRequests.toLocaleString()}건
              </p>
            </button>

            {EMPLOYEE_INCOME_TYPE_OPTIONS.map((option) => {
              const item = summaryByIncomeType.get(option.value);
              const isActive = incomeTypeFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleIncomeTypeFilter(option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getIncomeTypeTone(option.value)}`}
                    >
                      {option.label}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">
                    {item?.total.toLocaleString() ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    재직중 {item?.active.toLocaleString() ?? 0}명 · 대기{" "}
                    {item?.pendingRequests.toLocaleString() ?? 0}건
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {summary && (
          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  조회 필터
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  소득유형과 재직 상태를 조합해 원하는 지급 대상자만 빠르게
                  확인하세요.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="이름, 사원코드, 부서, 연락처 검색"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none sm:w-80"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  검색
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusFilter(filter.value)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-gray-500"
                      }`}
                    >
                      {filter.getCount(summary).toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(pendingCreateRequests.length > 0 || pendingUpdateRows.length > 0) && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-amber-950">
                  처리 대기 중인 요청
                </h2>
                <p className="mt-1 text-sm text-amber-900/80">
                  세무대리인 검토가 필요한 요청입니다. 승인되면 대시보드에
                  자동 반영됩니다.
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
                const payload = request.requestedPayload as { name?: string | null };
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
                      ? new Date(
                          employee.pendingRequest.createdAt,
                        ).toLocaleString()
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
          <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                통합 지급 대상자 목록
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                현재 조건 {total.toLocaleString()}명
                {summary ? ` / 전체 ${summary.total.toLocaleString()}명` : ""}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {search
                ? `검색어 "${search}" 적용 중`
                : "소득유형별 등록 대상을 통합 정렬로 보여줍니다."}
            </div>
          </div>

          {listLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              지급 대상자 목록을 불러오는 중...
            </div>
          ) : listError ? (
            <div className="p-10 text-center text-sm text-red-600">
              {listError}
            </div>
          ) : employees.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500">
                {search || incomeTypeFilter !== "ALL" || statusFilter !== "ALL"
                  ? "현재 필터 조건에 맞는 지급 대상자가 없습니다."
                  : "등록된 지급 대상자가 없습니다. 등록 요청을 먼저 진행해주세요."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      <th className="px-5 py-3 text-left">소득유형</th>
                      <th className="px-5 py-3 text-left">지급 대상자</th>
                      <th className="px-5 py-3 text-left">재직상태</th>
                      <th className="px-5 py-3 text-left">조직정보</th>
                      <th className="px-5 py-3 text-left">연락처</th>
                      <th className="px-5 py-3 text-left">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((employee) => {
                      const status = getEmployeeStatus(
                        employee.hireDate,
                        employee.resignDate,
                      );
                      const pendingLabel = getPendingRequestLabel(
                        employee.pendingRequest,
                      );

                      return (
                        <tr
                          key={`${employee.incomeType}-${employee.id}`}
                          className="align-top hover:bg-gray-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getIncomeTypeTone(employee.incomeType)}`}
                              >
                                {employee.incomeTypeLabel}
                              </span>
                              {pendingLabel && (
                                <span className="inline-flex w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                  {pendingLabel}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900">
                              {employee.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              사원코드 {employee.employeeCode ?? "-"} · 생년월일{" "}
                              {getBirthDate(employee.residentNumber)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusTone(status)}`}
                              >
                                {status ?? "미확인"}
                              </span>
                              <div className="text-xs text-gray-500">
                                입사 {formatDate(employee.hireDate)}
                              </div>
                              <div className="text-xs text-gray-500">
                                퇴사 {formatDate(employee.resignDate)}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            <div>{employee.department || "-"}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {employee.positionTitle || "직책 미등록"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            <div>{employee.phone || "연락처 미등록"}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {employee.email || "이메일 미등록"}
                            </div>
                            {employee.bankAccount && (
                              <div className="mt-2 text-xs text-gray-500">
                                {employee.bankAccount.bankName} ·{" "}
                                {employee.bankAccount.accountHolder}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-2">
                              {employee.canViewDetail ? (
                                <Link
                                  href={`/company/employees/${employee.id}`}
                                  className="inline-flex rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  상세 관리
                                </Link>
                              ) : (
                                <span className="inline-flex rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                                  통합 조회
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                등록일{" "}
                                {new Date(employee.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-5 py-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  >
                    이전
                  </button>
                  <span className="text-xs text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
