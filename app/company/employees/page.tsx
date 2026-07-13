"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CompanyEmployeeDashboardSummary,
  type EmployeeIncomeFilter,
  type EmployeeStatusFilter,
} from "@/types/company/employees";
import EmployeeFilters from "@/app/company/_components/employees/EmployeeFilters";
import EmployeesPageHero from "@/app/company/_components/employees/EmployeesPageHero";
import EmployeeSummaryCards from "@/app/company/_components/employees/EmployeeSummaryCards";
import EmployeeTable from "@/app/company/_components/employees/EmployeeTable";
import type {
  DashboardEmployeeRow,
  EmployeeListResponse,
  EmployeeSortOption,
} from "@/app/company/_components/employees/types";

export default function CompanyEmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<DashboardEmployeeRow[]>([]);
  const [summary, setSummary] =
    useState<CompanyEmployeeDashboardSummary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [incomeTypeFilter, setIncomeTypeFilter] =
    useState<EmployeeIncomeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>("ALL");
  const [sortOption, setSortOption] = useState<EmployeeSortOption>("NAME");

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
      setSummary(data.summary);
      setTotalPages(data.totalPages);
    } catch {
      setListError("지급 대상자 목록을 불러오지 못했습니다.");
    } finally {
      setListLoading(false);
    }
  }, [handleAuthError, incomeTypeFilter, page, router, search, statusFilter]);

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

  const sortedEmployees = useMemo(() => {
    const collator = new Intl.Collator("ko-KR", {
      numeric: true,
      sensitivity: "base",
    });

    return [...employees].sort((a, b) => {
      if (sortOption === "NAME") {
        const nameCompare = collator.compare(a.name, b.name);
        if (nameCompare !== 0) return nameCompare;
      } else {
        const aCode = a.employeeCode?.trim() || "ZZZZZZZZ";
        const bCode = b.employeeCode?.trim() || "ZZZZZZZZ";
        const codeCompare = collator.compare(aCode, bCode);
        if (codeCompare !== 0) return codeCompare;
      }

      return collator.compare(a.name, b.name);
    });
  }, [employees, sortOption]);

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <EmployeesPageHero />

        <EmployeeSummaryCards
          summary={summary}
          incomeTypeFilter={incomeTypeFilter}
          onIncomeTypeFilter={handleIncomeTypeFilter}
        />

        <EmployeeFilters
          summary={summary}
          searchInput={searchInput}
          statusFilter={statusFilter}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
        />

        <EmployeeTable
          employees={sortedEmployees}
          listLoading={listLoading}
          listError={listError}
          search={search}
          incomeTypeFilter={incomeTypeFilter}
          statusFilter={statusFilter}
          page={page}
          totalPages={totalPages}
          sortOption={sortOption}
          onPageChange={setPage}
          onSortOptionChange={setSortOption}
        />
      </div>
    </div>
  );
}
