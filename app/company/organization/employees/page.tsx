"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmployeeTable from "@/app/_components/EmployeeTable";
import type { EmployeeRow } from "@/app/_components/EmployeeTable";

type EmployeeListResponse = {
  employees: EmployeeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function CompanyEmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

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
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/company/employees?${params}`, {
        cache: "no-store",
      });
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
  }, [page, search, handleAuthError, router]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (employeeId: string, name: string) => {
    if (!confirm(`"${name}" 직원을 삭제하시겠습니까?`)) return;

    setDeleteLoadingId(employeeId);
    try {
      const res = await fetch(`/api/company/employees/${employeeId}`, {
        method: "DELETE",
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

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            직원 관리
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            직원들의 이메일과 연락처를 입력하시면, 급여명세서를 자동으로 발송할
            수 있습니다.
          </p>
        </div>

        {/* Action bar */}
        <div className="mb-5 flex gap-2">
          <Link
            href="/company/organization/employees/new"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            직원 등록
          </Link>
        </div>

        {/* Employee Table */}
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
          detailBaseUrl="/company/organization/employees"
        />
      </div>
    </div>
  );
}
