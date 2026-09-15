"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatBusinessNumber,
  formatDateDisplay,
  formatPhoneDisplay,
} from "@/app/lib/formatters";
import type { ApiErrorResponse } from "@/types/agent/auth";
import type {
  AgentCompanyUsersResponse,
  CompanyJoinRequestItem,
  CompanyJoinRequestsResponse,
  CompanyUserInviteHistoryItem,
  CompanyUserInviteHistoryResponse,
} from "@/types/agent/company";
import { InviteCompanyUserModal } from "./_components/InviteCompanyUserModal";

export default function AgentCompanyUsersPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const companyId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentCompanyUsersResponse | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showInviteHistory, setShowInviteHistory] = useState(false);
  const [inviteHistory, setInviteHistory] = useState<
    CompanyUserInviteHistoryItem[]
  >([]);
  const [inviteHistoryLoading, setInviteHistoryLoading] = useState(false);
  const [joinRequests, setJoinRequests] = useState<CompanyJoinRequestItem[]>(
    [],
  );
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [joinActionId, setJoinActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/agent/company/${companyId}/users`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }

        const body = (await res.json()) as
          | AgentCompanyUsersResponse
          | ApiErrorResponse;

        if (!res.ok) {
          const errorBody = body as ApiErrorResponse;
          setError(errorBody.error || "거래처 사용자 조회에 실패했습니다.");
          setData(null);
          return;
        }

        setData(body as AgentCompanyUsersResponse);
      } catch {
        setError("거래처 사용자 조회에 실패했습니다.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [companyId, router, refreshKey]);

  const fetchInviteHistory = useCallback(async (cid: string) => {
    setInviteHistoryLoading(true);
    try {
      const res = await fetch(`/api/agent/company/${cid}/users/invite`, {
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as CompanyUserInviteHistoryResponse;
        setInviteHistory(body.invites);
      }
    } catch {
      // silent
    } finally {
      setInviteHistoryLoading(false);
    }
  }, []);

  const fetchJoinRequests = useCallback(async (cid: string) => {
    setJoinRequestsLoading(true);
    try {
      const res = await fetch(`/api/agent/company/${cid}/join-requests`, {
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as CompanyJoinRequestsResponse;
        setJoinRequests(body.requests);
      }
    } catch {
      // silent
    } finally {
      setJoinRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const timer = window.setTimeout(() => {
      void fetchJoinRequests(companyId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [companyId, fetchJoinRequests, refreshKey]);

  const handleInvited = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // 초대 이력도 갱신
    if (showInviteHistory && companyId) {
      void fetchInviteHistory(companyId);
    }
  }, [showInviteHistory, companyId, fetchInviteHistory]);

  const handleToggleHistory = useCallback(() => {
    if (!showInviteHistory && companyId) {
      void fetchInviteHistory(companyId);
    }
    setShowInviteHistory((v) => !v);
  }, [showInviteHistory, companyId, fetchInviteHistory]);

  const handleJoinRequestAction = useCallback(
    async (requestId: string, action: "approve" | "reject") => {
      if (!companyId) return;

      setJoinActionId(requestId);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/agent/company/${companyId}/join-requests/${requestId}/${action}`,
          { method: "POST" },
        );
        const body = (await res.json()) as { error?: string };
        if (!res.ok) {
          setMessage({
            type: "error",
            text:
              body.error ||
              (action === "approve"
                ? "가입 요청 승인에 실패했습니다."
                : "가입 요청 거절에 실패했습니다."),
          });
          return;
        }

        setMessage({
          type: "success",
          text:
            action === "approve"
              ? "가입 요청을 승인했습니다."
              : "가입 요청을 거절했습니다.",
        });
        setRefreshKey((k) => k + 1);
        void fetchJoinRequests(companyId);
      } catch {
        setMessage({
          type: "error",
          text: "가입 요청 처리 중 오류가 발생했습니다.",
        });
      } finally {
        setJoinActionId(null);
      }
    },
    [companyId, fetchJoinRequests],
  );

  const companyLabel = useMemo(() => {
    if (!data) return "";
    return (
      data.company.businessName ||
      formatBusinessNumber(data.company.businessNumber)
    );
  }, [data]);

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              거래처 사용자 관리
            </h1>
            {data && (
              <p className="mt-1 text-sm text-gray-500">
                {companyLabel} (
                {formatBusinessNumber(data.company.businessNumber)})
              </p>
            )}
          </div>
          {data && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              거래처 사용자 초대
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              message.type === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="my-8">
          <div className="mb-3 ">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">
              사업장 가입 요청
            </h2>
            <p className="text-xs leading-5 text-gray-500">
              거래처 사용자로 가입을 먼저 요청한 사용자입니다. 승인하면 거래처
              기능을 사용할 수 있습니다.
            </p>
          </div>

          {joinRequestsLoading ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-950/5">
              <p className="text-sm text-gray-500">
                가입 요청을 불러오는 중...
              </p>
            </div>
          ) : joinRequests.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-950/5">
              <p className="text-sm text-gray-500">
                대기 중인 가입 요청이 없습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      요청자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      사업자번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      요청일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      처리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {joinRequests.map((joinRequest) => {
                    const busy = joinActionId === joinRequest.id;
                    return (
                      <tr key={joinRequest.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {joinRequest.companyUser.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {joinRequest.companyUser.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700">
                          {formatBusinessNumber(joinRequest.businessNumber)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDateDisplay(joinRequest.requestedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void handleJoinRequestAction(
                                  joinRequest.id,
                                  "approve",
                                )
                              }
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              승인
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void handleJoinRequestAction(
                                  joinRequest.id,
                                  "reject",
                                )
                              }
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              거절
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              거래처 사용자 목록을 불러오는 중...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !data ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              사용자 정보를 확인할 수 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
              <p className="text-sm text-gray-600">총 {data.summary.total}명</p>
              <p className="mt-1 text-xs text-gray-500">
                활성 {data.summary.active} / 마스터 {data.summary.masters}
              </p>
            </div>

            {data.users.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                <p className="text-sm text-gray-500">
                  해당 거래처에 연결된 사용자가 없습니다.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        이름/이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        권한
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        연락처
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        가입일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.isMaster
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.isMaster ? "MASTER" : "MEMBER"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              user.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.isActive ? "활성" : "탈퇴"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {user.phone ? formatPhoneDisplay(user.phone) : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDateDisplay(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── 초대 이력 섹션 ── */}
        {data && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleToggleHistory}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showInviteHistory ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
              초대 발송 이력
            </button>

            {showInviteHistory && (
              <>
                {inviteHistoryLoading ? (
                  <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">
                      초대 이력을 불러오는 중...
                    </p>
                  </div>
                ) : inviteHistory.length === 0 ? (
                  <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">
                      발송된 초대가 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            초대 방식
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            연락처
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            권한
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            발송자
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            상태
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            발송일
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {inviteHistory.map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-3">
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                {inv.contactType === "email"
                                  ? "이메일"
                                  : "전화번호"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {inv.contact}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                {inv.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-700">{inv.inviterName}</p>
                              <p className="text-xs text-gray-400">
                                {inv.inviterEmail}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  inv.isExpired
                                    ? "bg-gray-100 text-gray-500"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {inv.isExpired ? "만료" : "대기중"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formatDateDisplay(inv.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {companyId && (
        <InviteCompanyUserModal
          companyId={companyId}
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}
