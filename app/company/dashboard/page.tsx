"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAuthMeResponse } from "@/types/company/auth";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { AgentOrganizationCard } from "./_components/AgentOrganizationCard";
import { DashboardHero } from "./_components/DashboardHero";
import { DashboardPageState } from "./_components/DashboardPageState";
import { EmployeeOverviewSection } from "./_components/EmployeeOverviewSection";
import { formatOrganizationNumber } from "./_components/formatters";
import { QuickActionsSection } from "./_components/QuickActionsSection";
import { SalaryOverviewSection } from "./_components/SalaryOverviewSection";
import { TransferRequestNotice } from "./_components/TransferRequestNotice";
import type {
  InviteContactType,
  InviteResult,
  PendingTransferRequest,
} from "./_components/types";

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyAuthMeResponse | null>(null);
  const [dashboard, setDashboard] = useState<CompanyDashboardResponse | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingRequest, setPendingRequest] =
    useState<PendingTransferRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteContactType, setInviteContactType] =
    useState<InviteContactType>("email");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
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

        const [dashboardRes, transferRes] = await Promise.all([
          fetch("/api/company/dashboard", { cache: "no-store" }),
          fetch("/api/company/auth/agent-transfer-request", {
            cache: "no-store",
          }),
        ]);

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

        if (transferRes.ok) {
          const transferData = (await transferRes.json()) as {
            hasPendingRequest: boolean;
            request?: PendingTransferRequest;
          };
          setPendingRequest(
            transferData.hasPendingRequest
              ? (transferData.request ?? null)
              : null,
          );
        }
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

  const handleAcceptTransfer = async () => {
    setAccepting(true);
    setTransferMessage(null);
    try {
      const res = await fetch("/api/company/auth/agent-transfer-request", {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setTransferMessage(data.error || "요청 수락에 실패했습니다.");
        return;
      }

      setPendingRequest(null);
      setTransferMessage(data.message || "요청을 수락했습니다.");
      setReloadKey((value) => value + 1);
    } catch {
      setTransferMessage("서버 연결에 실패했습니다.");
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectTransfer = async () => {
    setRejecting(true);
    setTransferMessage(null);
    try {
      const res = await fetch("/api/company/auth/agent-transfer-request", {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setTransferMessage(data.error || "요청 거절에 실패했습니다.");
        return;
      }

      setPendingRequest(null);
      setTransferMessage(data.message || "연결 요청을 거절했습니다.");
    } catch {
      setTransferMessage("서버 연결에 실패했습니다.");
    } finally {
      setRejecting(false);
    }
  };

  const handleSendInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dashboard || dashboard.agentOrganization) return;

    setInviteSending(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/company/agent-signup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactType: inviteContactType,
          contact: inviteContact,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!res.ok) {
        setInviteResult({
          ok: false,
          message: body?.error || "가입 요청 발송에 실패했습니다.",
        });
        return;
      }

      setInviteResult({
        ok: true,
        message: body?.message || "가입 요청을 발송했습니다.",
      });
      setInviteContact("");
      setReloadKey((value) => value + 1);
    } catch {
      setInviteResult({
        ok: false,
        message: "서버 연결에 실패했습니다.",
      });
    } finally {
      setInviteSending(false);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    if (!profile || companyId === profile.currentCompanyId) return;

    setSwitchingCompany(true);
    setTransferMessage(null);
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

  const handleToggleInvite = () => {
    setInviteOpen((value) => !value);
    setInviteResult(null);
  };

  const handleInviteContactTypeChange = (contactType: InviteContactType) => {
    setInviteContactType(contactType);
    setInviteContact("");
    setInviteResult(null);
  };

  const handleInviteContactChange = (contact: string) => {
    setInviteContact(contact);
    setInviteResult(null);
  };

  if (loading) {
    return <DashboardPageState message="대시보드 정보를 불러오는 중..." />;
  }

  if (error || !dashboard) {
    return (
      <DashboardPageState
        message={error || "대시보드 정보를 확인할 수 없습니다."}
      />
    );
  }

  const { company, salary, employees, agentOrganization } = dashboard;
  const agentLabel = agentOrganization
    ? agentOrganization.organizationName ||
      formatOrganizationNumber(agentOrganization.organizationNumber)
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

        <AgentOrganizationCard
          agentOrganization={agentOrganization}
          signupRequestHistories={dashboard.agentSignupRequestHistories}
          agentLabel={agentLabel}
          inviteOpen={inviteOpen}
          inviteContactType={inviteContactType}
          inviteContact={inviteContact}
          inviteSending={inviteSending}
          inviteResult={inviteResult}
          onToggleInvite={handleToggleInvite}
          onInviteContactTypeChange={handleInviteContactTypeChange}
          onInviteContactChange={handleInviteContactChange}
          onSendInvite={(event) => {
            void handleSendInvite(event);
          }}
        />

        <TransferRequestNotice
          pendingRequest={pendingRequest}
          accepting={accepting}
          rejecting={rejecting}
          transferMessage={transferMessage}
          onAcceptTransfer={() => {
            void handleAcceptTransfer();
          }}
          onRejectTransfer={() => {
            void handleRejectTransfer();
          }}
        />

        <SalaryOverviewSection companyId={company.id} salary={salary} />
        <EmployeeOverviewSection employees={employees} />
        <QuickActionsSection companyId={company.id} />
      </div>
    </div>
  );
}
