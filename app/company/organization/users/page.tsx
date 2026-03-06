"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyUsersResponse } from "@/types/company/users";
import type {
  CompanyInviteHistoryItem,
  CompanyInviteHistoryResponse,
} from "@/types/company/users";
import { InviteCompanyUserModal } from "./_components/InviteCompanyUserModal";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

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

  const handleToggleInviteHistory = () => {
    const next = !showInviteHistory;
    setShowInviteHistory(next);
    if (next && inviteHistory.length === 0) {
      void loadInviteHistory();
    }
  };

  const companyLabel = useMemo(() => {
    if (!data) return "";
    return (
      data.company.businessName ||
      formatBusinessNumber(data.company.businessNumber)
    );
  }, [data]);

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

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              사용자 관리
            </h1>
            {data && (
              <p className="mt-1 text-sm text-gray-500">
                {companyLabel} (
                {formatBusinessNumber(data.company.businessNumber)})
              </p>
            )}
          </div>

          {data?.canManageUsers && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
              사용자 초대
            </button>
          )}
        </div>

        {data && !data.canManageUsers && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            마스터 사용자만 사용자 상태 변경 및 초대를 할 수 있습니다.
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
                            {formatDate(user.createdAt)}
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
                              {formatDate(inv.createdAt)}
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
