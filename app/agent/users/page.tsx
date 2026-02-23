"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorResponse } from "@/types/agent/auth";
import type {
  UsersMessageState,
  UsersResponse,
  UserType,
} from "@/types/agent/users";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

export default function AgentUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<UsersMessageState>(null);
  const [data, setData] = useState<UsersResponse | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agent/users", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        if (body?.error?.includes("마스터")) {
          setMessage({
            type: "error",
            text: "마스터 사용자만 접근할 수 있습니다.",
          });
          setData(null);
          return;
        }
        router.replace("/agent/auth/organization");
        return;
      }
      if (!res.ok) {
        throw new Error("조회 실패");
      }

      const payload = (await res.json()) as UsersResponse;
      setData(payload);
    } catch {
      setMessage({
        type: "error",
        text: "사용자 현황을 불러오지 못했습니다.",
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (
    userType: UserType,
    userId: string,
    nextIsActive: boolean,
  ) => {
    setSubmittingKey(`${userType}:${userId}`);
    setMessage(null);
    try {
      const res = await fetch("/api/agent/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          userId,
          isActive: nextIsActive,
        }),
      });

      const body = (await res.json()) as ApiErrorResponse;
      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        setMessage({
          type: "error",
          text: body.error || "권한이 없습니다.",
        });
        return;
      }
      if (!res.ok) {
        setMessage({
          type: "error",
          text: body.error || "상태 변경에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: nextIsActive
          ? "사용자 복구가 완료되었습니다."
          : "사용자 탈퇴 처리가 완료되었습니다.",
      });
      await loadUsers();
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setSubmittingKey(null);
    }
  };

  const summaryItems = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "소속 사용자",
        total: data.summary.agentUsers.total,
        active: data.summary.agentUsers.active,
        masters: data.summary.agentUsers.masters,
      },
      {
        label: "거래처 사용자",
        total: data.summary.companyUsers.total,
        active: data.summary.companyUsers.active,
        masters: data.summary.companyUsers.masters,
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            사용자 관리
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            마스터 권한으로 소속 사용자 현황을 확인하고 탈퇴 처리할 수 있습니다.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              message.type === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              사용자 현황을 불러오는 중...
            </p>
          </div>
        ) : !data ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              사용자 관리 정보를 확인할 수 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5"
                >
                  <p className="text-sm font-medium text-gray-600">
                    {item.label}
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {item.total}
                    </p>
                    <p className="text-xs text-gray-500">
                      활성 {item.active} / 마스터 {item.masters}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <section className="mb-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  소속 사용자
                </h2>
              </div>
              <div className="overflow-x-auto">
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
                        가입일
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.agentUsers.map((user) => {
                      const actionKey = `AGENT:${user.id}`;
                      const disabled = submittingKey === actionKey;
                      const isSelf = user.id === data.currentUserId;
                      return (
                        <tr key={user.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
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
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={disabled || (isSelf && user.isActive)}
                              onClick={() =>
                                void handleToggleActive(
                                  "AGENT",
                                  user.id,
                                  !user.isActive,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                user.isActive
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {user.isActive ? "탈퇴 처리" : "복구"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  거래처 사용자
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        이름/이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        소속 회사
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        권한
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        상태
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.companyUsers.map((user) => {
                      const actionKey = `COMPANY:${user.id}`;
                      const disabled = submittingKey === actionKey;
                      return (
                        <tr key={user.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            <p className="font-medium text-gray-700">
                              {user.company.businessName || "상호 미입력"}
                            </p>
                            <p>
                              {formatBusinessNumber(
                                user.company.businessNumber,
                              )}
                            </p>
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
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                void handleToggleActive(
                                  "COMPANY",
                                  user.id,
                                  !user.isActive,
                                )
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                user.isActive
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {user.isActive ? "탈퇴 처리" : "복구"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
