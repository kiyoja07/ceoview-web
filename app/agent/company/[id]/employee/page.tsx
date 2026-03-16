"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import EmployeeTable from "@/app/_components/EmployeeTable";
import type { EmployeeRow } from "@/app/_components/EmployeeTable";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────
// Income type tabs
// ────────────────────────────────────────────────────────────

const INCOME_TYPES = [
  { value: "EARNED_INCOME", label: "근로소득자" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득자" },
  { value: "BUSINESS_INCOME", label: "사업소득자" },
  { value: "OTHER_INCOME", label: "기타소득자" },
] as const;

type IncomeType = (typeof INCOME_TYPES)[number]["value"];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

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
  const loadEmployees = useCallback(async () => {
    if (!companyId) return;

    setListLoading(true);
    setListError(null);

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

      if (handleAuthError(res.status)) return;

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setListError(body?.error || "직원 목록을 불러오지 못했습니다.");
        return;
      }

      const data = (await res.json()) as EmployeeListResponse;
      setEmployees(data.employees);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setListError("직원 목록을 불러오지 못했습니다.");
    } finally {
      setListLoading(false);
    }
  }, [companyId, page, search, incomeType, handleAuthError]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

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
        void loadEmployees();
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
            거래처 직원 관리
          </h1>
          {titleCompany && (
            <p className="mt-1 text-sm text-gray-500">{titleCompany}</p>
          )}
        </div>

        {/* Income type tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1">
          {INCOME_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleIncomeTypeChange(type.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                incomeType === type.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="mb-5 flex gap-2">
          <Link
            href={`/agent/company/${companyId}/employee/new`}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            직원 개별 등록
          </Link>
          <Link
            href={`/agent/employee/new?companyId=${companyId}`}
            className="inline-flex items-center rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
          >
            직원 엑셀 파일 등록
          </Link>
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
          detailBaseUrl={`/agent/company/${companyId}/employee`}
        />
      </div>
    </div>
  );
}
