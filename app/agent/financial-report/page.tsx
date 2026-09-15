"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CompanyRow,
  DashboardResponse,
  DashboardSummary,
  FilterMode,
} from "./_components/types";
import {
  IconBuilding,
  IconChartBar,
  IconCheckCircle,
  IconDocument,
  IconError,
  IconSearch,
} from "./_components/icons";
import { SummaryCard } from "./_components/SummaryCard";
import { CompanyCard } from "./_components/CompanyCard";
import { FINANCIAL_REPORT_DASHBOARD_FILTER_OPTIONS } from "@/catalogs/ko/financial-report-dashboard";

/* ────────────── Main Page ────────────── */

export default function FinancialReportDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/agent/financial-report/dashboard");
        if (res.status === 401) {
          if (mounted) router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          if (mounted) router.replace("/agent/auth/organization");
          return;
        }
        if (!res.ok) throw new Error("조회 실패");
        const data = (await res.json()) as DashboardResponse;
        if (mounted) {
          setSummary(data.summary);
          setCompanies(data.companies);
        }
      } catch {
        if (mounted) setError("재무리포트 현황을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filtered = useMemo(() => {
    let result = companies;

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          (c.businessName ?? "").toLowerCase().includes(q) ||
          c.businessNumber.includes(q) ||
          (c.representativeName ?? "").toLowerCase().includes(q),
      );
    }

    // Status filter
    if (filter === "published") {
      result = result.filter((c) => c.isPublished);
    } else if (filter === "unpublished") {
      result = result.filter((c) => c.reportCount > 0 && !c.isPublished);
    } else if (filter === "no-report") {
      result = result.filter((c) => c.reportCount === 0);
    }

    return result;
  }, [companies, search, filter]);

  const filterCounts = useMemo(() => {
    return {
      all: companies.length,
      published: companies.filter((c) => c.isPublished).length,
      unpublished: companies.filter((c) => c.reportCount > 0 && !c.isPublished)
        .length,
      "no-report": companies.filter((c) => c.reportCount === 0).length,
    };
  }, [companies]);

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <IconDocument />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                재무리포트 관리 현황
              </h1>
              <p className="text-sm text-gray-500">
                거래처별 재무리포트 생성 및 게시 상태를 한눈에 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5"
                />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5"
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-950/5">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <IconError />
            </div>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              type="button"
              onClick={() =>
                void (async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const res = await fetch(
                      "/api/agent/financial-report/dashboard",
                    );
                    if (res.status === 401) {
                      router.replace("/agent/auth/login");
                      return;
                    }
                    if (res.status === 403) {
                      router.replace("/agent/auth/organization");
                      return;
                    }
                    if (!res.ok) throw new Error("조회 실패");
                    const data = (await res.json()) as DashboardResponse;
                    setSummary(data.summary);
                    setCompanies(data.companies);
                  } catch {
                    setError("재무리포트 현황을 불러오지 못했습니다.");
                  } finally {
                    setLoading(false);
                  }
                })()
              }
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Dashboard content */}
        {!loading && !error && summary && (
          <>
            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="전체 거래처"
                value={summary.totalCompanies}
                icon={<IconBuilding />}
                color="bg-blue-600"
              />
              <SummaryCard
                label="리포트 등록"
                value={summary.companiesWithReports}
                icon={<IconChartBar />}
                color="bg-indigo-600"
                sub={`${summary.totalCompanies > 0 ? Math.round((summary.companiesWithReports / summary.totalCompanies) * 100) : 0}% 등록률`}
              />
              <SummaryCard
                label="게시 완료"
                value={summary.companiesPublished}
                icon={<IconCheckCircle />}
                color="bg-emerald-600"
                sub={`${summary.companiesWithReports > 0 ? Math.round((summary.companiesPublished / summary.companiesWithReports) * 100) : 0}% 게시율`}
              />
              <SummaryCard
                label="총 리포트"
                value={summary.totalReports}
                icon={<IconDocument />}
                color="bg-purple-600"
              />
            </div>

            {/* Search and filter bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="상호명, 사업자번호, 대표자명 검색..."
                  className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5">
                {FINANCIAL_REPORT_DASHBOARD_FILTER_OPTIONS.map(
                  ({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        filter === key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                          filter === key
                            ? "bg-blue-500 text-blue-100"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {filterCounts[key]}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Company list */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <IconBuilding />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {companies.length === 0
                    ? "등록된 거래처가 없습니다"
                    : "검색 결과가 없습니다"}
                </p>
                {companies.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    거래처를 먼저 등록한 후 재무리포트를 관리하세요
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
