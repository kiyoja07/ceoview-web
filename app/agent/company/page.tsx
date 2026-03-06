"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  AgentCompanyListItem,
  AgentCompanyPaginatedResponse,
} from "@/types/agent/company";
import CompanyListHeader from "./_components/CompanyListHeader";
import CompanyCreatedToast from "./_components/CompanyCreatedToast";
import CompanyTransferRequestedToast from "./_components/CompanyTransferRequestedToast";
import CompanyTable from "./_components/CompanyTable";
import {
  CompanyListLoading,
  CompanyListError,
  CompanyListEmpty,
} from "./_components/CompanyListStates";
import Pagination from "./_components/Pagination";
import OnboardingGuide from "./_components/OnboardingGuide";

const PAGE_SIZE = 50;

export default function CompanyListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const created = searchParams.get("created") === "1";
  const requested = searchParams.get("requested") === "1";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [companies, setCompanies] = useState<AgentCompanyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/agent/company?page=${currentPage}&size=${PAGE_SIZE}`,
        );
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }
        if (!res.ok) throw new Error("목록 조회 실패");
        const data = (await res.json()) as AgentCompanyPaginatedResponse;
        setCompanies(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        setError("사업자 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void fetchCompanies();
  }, [router, currentPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/agent/company?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="min-h-screen bg-agent-bg">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <CompanyListHeader count={!loading && !error ? total : null} />

        {created && <CompanyCreatedToast />}
        {requested && <CompanyTransferRequestedToast />}

        <OnboardingGuide />

        {loading ? (
          <CompanyListLoading />
        ) : error ? (
          <CompanyListError message={error} />
        ) : companies.length === 0 ? (
          <CompanyListEmpty />
        ) : (
          <>
            <CompanyTable companies={companies} />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
