"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/app/_components/ui/PageState";
import {
  formatBusinessNumber,
  formatDateDisplay,
} from "@/app/lib/formatters";
import type { CompanyAuthMeResponse } from "@/types/company/auth";
import type { CompanyJoinRequestItem } from "@/types/company/users";

type JoinRequestsResponse = {
  requests: CompanyJoinRequestItem[];
  total: number;
};

export default function CompanyPendingJoinRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<CompanyJoinRequestItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const meRes = await fetch("/api/company/auth/me", {
          cache: "no-store",
        });

        if (meRes.status === 401) {
          router.replace("/company/auth/login");
          return;
        }

        if (!meRes.ok) {
          setError("계정 상태를 확인할 수 없습니다.");
          return;
        }

        const me = (await meRes.json()) as CompanyAuthMeResponse;
        if (me.profileComplete && !me.pendingJoinRequest) {
          router.replace("/company/dashboard");
          return;
        }

        const requestsRes = await fetch("/api/company/join-requests", {
          cache: "no-store",
        });
        const body = (await requestsRes.json()) as
          | JoinRequestsResponse
          | { error?: string };

        if (!requestsRes.ok) {
          setError(
            (body as { error?: string }).error ||
              "가입 요청 상태를 확인할 수 없습니다.",
          );
          return;
        }

        setRequest((body as JoinRequestsResponse).requests[0] ?? null);
      } catch {
        setError("가입 요청 상태를 확인할 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const statusLabel = useMemo(() => {
    if (!request) return "대기 중";
    if (request.status === "APPROVED") return "승인됨";
    if (request.status === "REJECTED") return "거절됨";
    return "승인 대기";
  }, [request]);

  if (loading) {
    return <PageLoading message="가입 요청 상태 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Company access
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              사업장 가입 승인 대기
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              사업장 관리자 또는 담당 에이전트가 가입 요청을 확인하고
              있습니다.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : request ? (
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">상태</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    request.status === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">사업장</span>
                <span className="font-medium text-gray-900">
                  {request.company.businessName ||
                    formatBusinessNumber(request.company.businessNumber)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">사업자번호</span>
                <span className="font-mono text-gray-900">
                  {formatBusinessNumber(request.company.businessNumber)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">요청일</span>
                <span className="text-gray-900">
                  {formatDateDisplay(request.requestedAt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              진행 중인 가입 요청이 없습니다. 사업자 정보를 다시 입력해주세요.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {(request?.status === "REJECTED" || !request) && (
              <Link
                href="/company/auth/onboarding"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                사업자 정보 다시 입력
              </Link>
            )}
            <Link
              href="/company/auth/logout"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              로그아웃
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
