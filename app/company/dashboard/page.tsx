"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAuthMeResponse } from "@/types/company/auth";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { DashboardMetricCard } from "./_components/DashboardMetricCard";
import { DashboardSparkline } from "./_components/DashboardSparkline";
import { QuickActionCard } from "./_components/QuickActionCard";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatOrganizationNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

type PendingTransferRequest = {
  id: string;
  createdAt: string;
  fromOrganization: {
    id: string;
    organizationNumber: string;
    organizationName: string | null;
  } | null;
  toOrganization: {
    id: string;
    organizationNumber: string;
    organizationName: string | null;
  };
};

const PUBLICATION_LABELS = {
  earned: "근로",
  business: "사업",
  daily: "일용",
  other: "기타",
} as const;

function formatCurrency(value: number) {
  return `₩ ${value.toLocaleString()}`;
}

function getPublicationBadgeStyle(status: "NONE" | "SAVED" | "PUBLISHED") {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-700";
  if (status === "SAVED") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

function getPublicationLabel(status: "NONE" | "SAVED" | "PUBLISHED") {
  if (status === "PUBLISHED") return "공개";
  if (status === "SAVED") return "비공개";
  return "없음";
}

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
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <p className="text-sm text-gray-500">대시보드 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <p className="text-sm text-gray-500">
          {error || "대시보드 정보를 확인할 수 없습니다."}
        </p>
      </div>
    );
  }

  const { company, salary, employees } = dashboard;
  const companyLabel =
    company.businessName || formatBusinessNumber(company.businessNumber);
  const agentLabel = dashboard.agentOrganization
    ? dashboard.agentOrganization.organizationName ||
      formatOrganizationNumber(dashboard.agentOrganization.organizationNumber)
    : "미지정";

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-8 rounded-3xl bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-800 px-6 py-7 text-white shadow-lg shadow-emerald-200/60">
          <p className="text-sm font-medium text-emerald-100">Company Dashboard</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{companyLabel}</h1>
              <p className="mt-2 text-sm text-emerald-100/90">
                {formatBusinessNumber(company.businessNumber)}
              </p>
              <p className="mt-3 text-sm text-emerald-50/85">
                급여와 직원 현황을 빠르게 확인하고 바로 필요한 작업으로 이동하세요.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <label
                  htmlFor="dashboard-company-select"
                  className="mb-1.5 block text-xs font-medium text-emerald-100/80"
                >
                  회사 선택
                </label>
                <select
                  id="dashboard-company-select"
                  value={profile?.currentCompanyId ?? company.id}
                  disabled={
                    !profile ||
                    profile.companies.length <= 1 ||
                    switchingCompany ||
                    loading
                  }
                  onChange={(event) => {
                    void handleCompanyChange(event.target.value);
                  }}
                  className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-medium text-white outline-none disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {(profile?.companies ?? [company]).map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      className="text-gray-900"
                    >
                      {item.businessName ||
                        formatBusinessNumber(item.businessNumber)}
                    </option>
                  ))}
                </select>
                {profile && profile.companies.length > 1 ? (
                  <p className="mt-2 text-xs text-emerald-100/75">
                    {switchingCompany
                      ? "선택한 회사로 전환하는 중입니다."
                      : "접근 가능한 회사 사이에서 현재 작업 회사를 전환할 수 있습니다."}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-emerald-100/75">
                    현재 계정은 회사 1곳에 연결되어 있습니다.
                  </p>
                )}
                {profile && !profile.profileComplete && (
                  <p className="mt-2 text-xs text-amber-100">
                    현재 선택한 회사의 기본 정보가 아직 완료되지 않았습니다.{" "}
                    <Link href="/company/auth/onboarding" className="underline">
                      회사 정보 입력
                    </Link>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-emerald-100/80">최신 급여 월</p>
                  <p className="mt-1 text-sm font-semibold">
                    {salary.latestLabel || "없음"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-emerald-100/80">총 직원</p>
                  <p className="mt-1 text-sm font-semibold">
                    {employees.total.toLocaleString()}명
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-emerald-100/80">재직중</p>
                  <p className="mt-1 text-sm font-semibold">
                    {employees.active.toLocaleString()}명
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-emerald-100/80">최근 등록</p>
                  <p className="mt-1 text-sm font-semibold">
                    {employees.recentJoined.toLocaleString()}명
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">담당 세무대리인</p>
              <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                {agentLabel}
              </p>
              {dashboard.agentOrganization ? (
                <>
                  <p className="mt-1 text-sm text-gray-500">
                    사업자번호{" "}
                    {formatOrganizationNumber(
                      dashboard.agentOrganization.organizationNumber,
                    )}
                  </p>
                  {dashboard.agentOrganization.representativeName && (
                    <p className="mt-1 text-sm text-gray-500">
                      대표자 {dashboard.agentOrganization.representativeName}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  현재 연결된 세무대리인 정보가 없습니다.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700">안내</p>
              <p className="mt-1 leading-relaxed">
                담당 세무대리인 변경 요청이 있으면 아래 알림 카드에서 확인하고
                수락할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {pendingRequest && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-amber-900">
              담당 에이전트 변경 요청
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {pendingRequest.fromOrganization
                ? `현재 담당: ${pendingRequest.fromOrganization.organizationName || formatOrganizationNumber(pendingRequest.fromOrganization.organizationNumber)}`
                : "현재 담당: 없음"}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              요청한 에이전트:{" "}
              {pendingRequest.toOrganization.organizationName ||
                formatOrganizationNumber(
                  pendingRequest.toOrganization.organizationNumber,
                )}
            </p>
            <button
              type="button"
              disabled={accepting}
              onClick={() => void handleAcceptTransfer()}
              className="mt-4 inline-flex items-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {accepting ? "수락 처리 중..." : "요청 수락"}
            </button>
            {transferMessage && (
              <p className="mt-3 text-sm text-amber-900">{transferMessage}</p>
            )}
          </div>
        )}

        {!pendingRequest && transferMessage && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {transferMessage}
          </div>
        )}

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                급여 현황
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                가장 최근 급여 월과 최근 6개월 추이를 빠르게 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/company/${company.id}/salary`}
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                급여 내역 보기
              </Link>
              <Link
                href={`/company/${company.id}/salary/dashboard`}
                className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                급여 대시보드
              </Link>
            </div>
          </div>

          {salary.hasData ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DashboardMetricCard
                    label="최신 급여 월"
                    value={salary.latestLabel || "-"}
                    description={`${salary.totalCount.toLocaleString()}건의 공개 급여 내역`}
                    tone="emerald"
                    icon={
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75"
                        />
                      </svg>
                    }
                  />
                  <DashboardMetricCard
                    label="총 지급액"
                    value={formatCurrency(salary.totalPayment)}
                    description="최신 급여 월 기준 공개된 총 지급액"
                    tone="blue"
                    icon={
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M12 6v12m3-9H9"
                        />
                      </svg>
                    }
                  />
                  <DashboardMetricCard
                    label="차인지급액"
                    value={formatCurrency(salary.netPayment)}
                    description="최신 급여 월 기준 실제 수령 총액"
                    tone="amber"
                    icon={
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v12m0 0 4-4m-4 4-4-4M3.75 7.5h16.5"
                        />
                      </svg>
                    }
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      공개 상태 요약
                    </p>
                    {Object.entries(salary.publicationByType).map(([key, value]) => (
                      <span
                        key={key}
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPublicationBadgeStyle(value.publishStatus)}`}
                      >
                        {PUBLICATION_LABELS[key as keyof typeof PUBLICATION_LABELS]} ·{" "}
                        {getPublicationLabel(value.publishStatus)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <DashboardSparkline months={salary.recentMonths} />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ring-1 ring-gray-950/5">
              <p className="text-base font-semibold text-gray-900">
                아직 공개된 급여 내역이 없습니다.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                급여 내역 화면에서 공개된 지급 내역이 생기면 여기에서 최신 급여 월과
                추이를 확인할 수 있습니다.
              </p>
              <div className="mt-5">
                <Link
                  href={`/company/${company.id}/salary`}
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  급여 내역 보기
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                직원 현황
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                공개된 직원 기준으로 재직 상태와 기본 정보 등록 수준을 요약합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/company/employees"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                직원 관리
              </Link>
              <Link
                href="/company/employees/new"
                className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                직원 등록
              </Link>
            </div>
          </div>

          {employees.total > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <DashboardMetricCard
                  label="총 직원"
                  value={`${employees.total.toLocaleString()}명`}
                  description={`최근 30일 등록 ${employees.recentJoined.toLocaleString()}명`}
                  tone="emerald"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a8.964 8.964 0 0 0 3.742-.479A3.75 3.75 0 0 0 18 15.75M15 20.25a8.97 8.97 0 0 1-6 0M6 18.72a8.964 8.964 0 0 1-3.742-.479A3.75 3.75 0 0 1 6 15.75m12 2.97a8.97 8.97 0 0 1-12 0M15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  }
                />
                <DashboardMetricCard
                  label="재직중"
                  value={`${employees.active.toLocaleString()}명`}
                  description={`입사예정 ${employees.upcoming.toLocaleString()}명 · 퇴사예정 ${employees.leaving.toLocaleString()}명`}
                  tone="blue"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  }
                />
                <DashboardMetricCard
                  label="연락처 등록"
                  value={`${employees.withContact.toLocaleString()}명`}
                  description={`이메일 ${employees.withEmail.toLocaleString()}명 · 계좌 ${employees.withBankAccount.toLocaleString()}명`}
                  tone="amber"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V6.75Zm1.856.53 7.114 4.743a1.5 1.5 0 0 0 1.56 0l7.114-4.743"
                      />
                    </svg>
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5 sm:grid-cols-5">
                <div>
                  <p className="text-xs text-gray-400">입사예정</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {employees.upcoming.toLocaleString()}명
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">퇴사예정</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {employees.leaving.toLocaleString()}명
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">퇴사완료</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {employees.inactive.toLocaleString()}명
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">이메일 등록</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {employees.withEmail.toLocaleString()}명
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">계좌 등록</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {employees.withBankAccount.toLocaleString()}명
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ring-1 ring-gray-950/5">
              <p className="text-base font-semibold text-gray-900">
                공개된 직원이 없습니다.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                직원을 등록하거나 공개 상태가 반영되면 이 영역에서 직원 현황을
                빠르게 확인할 수 있습니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/company/employees/new"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  직원 등록
                </Link>
                <Link
                  href="/company/employees"
                  className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  직원 관리
                </Link>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              주요 액션
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              자주 쓰는 작업 화면으로 바로 이동할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard
              href={`/company/${company.id}/salary`}
              title="급여 내역 보기"
              description="공개된 급여 내역과 월별 지급 상세를 확인합니다."
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15A2.25 2.25 0 0 0 6.75 21.75h10.5A2.25 2.25 0 0 0 19.5 19.5v-5.25Z"
                  />
                </svg>
              }
            />
            <QuickActionCard
              href="/company/employees"
              title="직원 관리"
              description="직원 목록을 보고 상태와 연락처 등록 현황을 관리합니다."
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.003c0 .252-.005.503-.014.754M12 15.75a4.125 4.125 0 1 0 0-8.25 4.125 4.125 0 0 0 0 8.25Z"
                  />
                </svg>
              }
            />
            <QuickActionCard
              href="/company/employees/new"
              title="직원 등록"
              description="새 직원을 등록하고 급여 발송에 필요한 정보를 입력합니다."
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 7.5v9m4.5-4.5h-9m-6.75 8.25h-1.5A2.25 2.25 0 0 1 3 18V6A2.25 2.25 0 0 1 5.25 3.75h9A2.25 2.25 0 0 1 16.5 6v1.5"
                  />
                </svg>
              }
            />
            <QuickActionCard
              href="/company/settings/info"
              title="회사 정보 관리"
              description="회사 기본 정보와 고객사 포털 설정을 점검합니다."
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3Zm4.5 4.5h6"
                  />
                </svg>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
