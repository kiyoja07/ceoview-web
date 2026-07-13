"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatBusinessNumber,
  formatDateDisplay,
} from "@/app/lib/formatters";
import type { CompanyUsersResponse } from "@/types/company/users";
import type {
  CompanyInviteHistoryItem,
  CompanyInviteHistoryResponse,
  CompanyJoinRequestItem,
  CompanyJoinRequestsResponse,
} from "@/types/company/users";
import { InviteCompanyUserModal } from "@/app/company/_components/InviteCompanyUserModal";

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

export default function CompanyOrganizationUsersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [data, setData] = useState<CompanyUsersResponse | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inviteHistory, setInviteHistory] = useState<
    CompanyInviteHistoryItem[]
  >([]);
  const [inviteHistoryLoading, setInviteHistoryLoading] = useState(false);
  const [showInviteHistory, setShowInviteHistory] = useState(false);
  const [joinRequests, setJoinRequests] = useState<CompanyJoinRequestItem[]>(
    [],
  );
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [joinActionId, setJoinActionId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const meRes = await fetch("/api/company/auth/me", {
          cache: "no-store",
        });
        if (meRes.status === 401) {
          router.replace("/company/auth/login");
          return;
        }

        if (meRes.ok) {
          const me = (await meRes.json()) as { profileComplete?: boolean };
          if (!me.profileComplete) {
            router.replace("/company/auth/onboarding");
            return;
          }
        }

        const res = await fetch("/api/company/users", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/company/auth/login");
          return;
        }

        const body = (await res.json()) as
          | CompanyUsersResponse
          | { error?: string };
        if (!res.ok) {
          setError(
            (body as { error?: string }).error ||
              "사용자 목록 조회에 실패했습니다.",
          );
          setData(null);
          return;
        }

        setData(body as CompanyUsersResponse);
      } catch {
        setError("사용자 목록 조회에 실패했습니다.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [refreshKey, router]);

  // 초대 이력 로드
  const loadInviteHistory = async () => {
    setInviteHistoryLoading(true);
    try {
      const res = await fetch("/api/company/users/invite", {
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as CompanyInviteHistoryResponse;
        setInviteHistory(body.invites);
      }
    } catch {
      // 조회 실패 시 무시
    } finally {
      setInviteHistoryLoading(false);
    }
  };

  const loadJoinRequests = useCallback(async () => {
    setJoinRequestsLoading(true);
    try {
      const res = await fetch("/api/company/join-requests", {
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as CompanyJoinRequestsResponse;
        setJoinRequests(body.requests);
      }
    } catch {
      // 조회 실패 시 무시
    } finally {
      setJoinRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data?.canManageUsers) return;
    const timer = window.setTimeout(() => {
      void loadJoinRequests();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [data?.canManageUsers, loadJoinRequests, refreshKey]);

  const handleToggleInviteHistory = () => {
    const next = !showInviteHistory;
    setShowInviteHistory(next);
    if (next && inviteHistory.length === 0) {
      void loadInviteHistory();
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (!data?.canManageUsers) return;

    setUpdatingUserId(userId);
    setMessage(null);

    try {
      const res = await fetch("/api/company/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({
          type: "error",
          text: body.error || "사용자 상태 변경에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "사용자 상태가 변경되었습니다.",
      });
      setRefreshKey((prev) => prev + 1);
    } catch {
      setMessage({
        type: "error",
        text: "사용자 상태 변경 중 오류가 발생했습니다.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleJoinRequestAction = async (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    if (!data?.canManageUsers) return;

    setJoinActionId(requestId);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/company/join-requests/${requestId}/${action}`,
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
      setRefreshKey((prev) => prev + 1);
      void loadJoinRequests();
    } catch {
      setMessage({
        type: "error",
        text: "가입 요청 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setJoinActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-8 rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-lg shadow-emerald-200/60">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                급여 관리자 관리
              </h1>
              <p className="mt-2 text-sm text-emerald-100/90">
                전체 급여 정보를 조회할 수 있는 회사 급여 담당자를 관리할 수
                있습니다.
              </p>
            </div>

            {data?.canManageUsers && (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                신규 급여 관리자 초대
              </button>
            )}
          </div>
        </div>

        {data && !data.canManageUsers && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            마스터 사용자만 급여 관리자 상태 변경 및 초대를 할 수 있습니다.
          </div>
        )}

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

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              사용자 목록을 불러오는 중...
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
            <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
              <p className="text-sm text-gray-600">총 {data.summary.total}명</p>
              <p className="mt-1 text-xs text-gray-500">
                활성 {data.summary.active} / 마스터 {data.summary.masters}
              </p>
            </section>

            {data.users.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                <p className="text-sm text-gray-500">
                  등록된 사용자가 없습니다.
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
                      {data.canManageUsers && (
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          관리
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.users.map((user) => {
                      const isSelf = user.id === data.currentUserId;
                      const isBusy = updatingUserId === user.id;

                      return (
                        <tr
                          key={user.id}
                          className={isSelf ? "bg-emerald-50/40" : ""}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {user.name}
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] font-medium text-emerald-700">
                                  (본인)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                user.isMaster
                                  ? "bg-emerald-50 text-emerald-700"
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
                              {user.isActive ? "활성" : "비활성"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.phone || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDateDisplay(user.createdAt)}
                          </td>
                          {data.canManageUsers && (
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={isBusy || isSelf}
                                onClick={() =>
                                  void handleToggleActive(
                                    user.id,
                                    !user.isActive,
                                  )
                                }
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                  user.isActive
                                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {isBusy
                                  ? "처리 중..."
                                  : user.isActive
                                    ? "비활성화"
                                    : "활성화"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {data.canManageUsers && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">
                  사업장 가입 요청
                </h2>
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
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            요청자
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            사업자번호
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            요청일
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
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
                                {formatBusinessNumber(
                                  joinRequest.businessNumber,
                                )}
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
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            )}
          </>
        )}

        {/* 초대 이력 섹션 */}
        {data && (
          <section className="mt-8">
            <button
              type="button"
              onClick={handleToggleInviteHistory}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showInviteHistory ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              초대 이력
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
                      초대 이력이 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            연락처
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            권한
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            초대자
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            상태
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            초대일
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {inviteHistory.map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-3">
                              <p className="text-gray-900">{inv.contact}</p>
                              <p className="text-xs text-gray-400">
                                {inv.contactType === "email"
                                  ? "이메일"
                                  : "휴대폰"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                {inv.role === "master" ? "MASTER" : "MEMBER"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-900">{inv.inviterName}</p>
                              <p className="text-xs text-gray-400">
                                {inv.inviterEmail}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  inv.isExpired
                                    ? "bg-gray-100 text-gray-500"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {inv.isExpired ? "만료됨" : "대기 중"}
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
          </section>
        )}
      </div>

      {data?.canManageUsers && (
        <InviteCompanyUserModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvited={() => setRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
