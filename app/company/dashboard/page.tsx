"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAuthMeResponse } from "@/types/company/auth";

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

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyAuthMeResponse | null>(null);
  const [pendingRequest, setPendingRequest] =
    useState<PendingTransferRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const data = (await res.json()) as CompanyAuthMeResponse;
        if (!data.profileComplete) {
          router.replace("/company/auth/onboarding");
          return;
        }
        setProfile(data);

        const transferRes = await fetch(
          "/api/company/auth/agent-transfer-request",
          {
            cache: "no-store",
          },
        );
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
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  const companyName = useMemo(() => {
    if (!profile?.company) return "";
    return (
      profile.company.businessName ||
      formatBusinessNumber(profile.company.businessNumber)
    );
  }, [profile]);

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
    } catch {
      setTransferMessage("서버 연결에 실패했습니다.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <p className="text-sm text-gray-500">사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!profile?.company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <p className="text-sm text-gray-500">회사 정보를 확인할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <div className="mb-7 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {profile.company.businessName || "회사"}{" "}
            <span className="text-base text-gray-600">
              ({formatBusinessNumber(profile.company.businessNumber)}){" "}
            </span>
          </h1>
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

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm font-medium text-gray-700">바로가기</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/company/${profile.company.id}/salary`}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              급여 내역 보기
            </Link>
            <Link
              href="/company/organization"
              className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              회사 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
