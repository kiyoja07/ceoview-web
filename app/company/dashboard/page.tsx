"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAuthMeResponse } from "@/types/company/auth";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { PageError, PageLoading } from "@/app/_components/ui/PageState";
import { AgentOrganizationCard } from "./_components/AgentOrganizationCard";
import { DashboardHero } from "./_components/DashboardHero";
import { EmployeeOverviewSection } from "./_components/EmployeeOverviewSection";
import { FinancialReportOverviewSection } from "./_components/FinancialReportOverviewSection";
import { QuickActionsSection } from "./_components/QuickActionsSection";
import { SalaryOverviewSection } from "./_components/SalaryOverviewSection";
import { formatBusinessNumber } from "../[id]/salary/lib/format";

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyAuthMeResponse | null>(null);
  const [dashboard, setDashboard] = useState<CompanyDashboardResponse | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const data = (await res.json()) as CompanyAuthMeResponse;
        if (!data.profileComplete && data.companies.length <= 1) {
          router.replace("/company/auth/onboarding");
          return;
        }
        if (!data.company) {
          setError("회사 정보를 확인할 수 없습니다.");
          return;
        }
        setProfile(data);

        const dashboardRes = await fetch("/api/company/dashboard", {
          cache: "no-store",
        });

        if (dashboardRes.status === 401) {
          router.replace("/company/auth/login");
          return;
        }

        const dashboardBody = (await dashboardRes.json().catch(() => null)) as
          | CompanyDashboardResponse
          | { error?: string }
          | null;

        if (!dashboardRes.ok) {
          throw new Error(
            dashboardBody && "error" in dashboardBody
              ? dashboardBody.error || "대시보드 정보를 불러오지 못했습니다."
              : "대시보드 정보를 불러오지 못했습니다.",
          );
        }

        setDashboard(dashboardBody as CompanyDashboardResponse);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "대시보드 정보를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [reloadKey, router]);

  const handleCompanyChange = async (companyId: string) => {
    if (!profile || companyId === profile.currentCompanyId) return;

    setSwitchingCompany(true);
    try {
      const res = await fetch("/api/company/auth/select-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(body.error || "회사 전환에 실패했습니다.");
        return;
      }

      window.dispatchEvent(new Event("company-selection-changed"));
      setReloadKey((value) => value + 1);
      router.refresh();
    } catch {
      setError("회사 전환에 실패했습니다.");
    } finally {
      setSwitchingCompany(false);
    }
  };

  if (loading) {
    return <PageLoading message="대시보드 정보를 불러오는 중..." />;
  }

  if (error || !dashboard) {
    return (
      <PageError
        message={error || "대시보드 정보를 확인할 수 없습니다."}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const { company, salary, employees, agentOrganization, financialReport } =
    dashboard;
  const agentLabel = agentOrganization
    ? agentOrganization.organizationName ||
      formatBusinessNumber(agentOrganization.organizationNumber)
    : "미지정";

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <DashboardHero
          company={company}
          profile={profile}
          loading={loading}
          switchingCompany={switchingCompany}
          onCompanyChange={(companyId) => {
            void handleCompanyChange(companyId);
          }}
        />

        {/* 세무대리인 카드*/}
        <AgentOrganizationCard
          agentOrganization={agentOrganization}
          agentLabel={agentLabel}
        />
        {/* 재무리포트 카드*/}
        <FinancialReportOverviewSection financialReport={financialReport} />
        {/* 인건비 카드*/}
        <SalaryOverviewSection companyId={company.id} salary={salary} />
        {/* 인건비 대상자 카드*/}
        <EmployeeOverviewSection employees={employees} />
        {/* 바로가기 카드*/}
        <QuickActionsSection companyId={company.id} />
      </div>
    </div>
  );
}
