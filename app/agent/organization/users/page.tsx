"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentAuthMeResponse, ApiErrorResponse } from "@/types/agent/auth";
import type { UsersMessageState, UsersResponse } from "@/types/agent/users";
import { UserInviteForm } from "./_components/UserInviteForm";
import { UserTable } from "./_components/UserTable";
import { StatusMessage } from "./_components/StatusMessage";
import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";

export default function AgentUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<UsersMessageState>(null);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [orgLabel, setOrgLabel] = useState<string | null>(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const me = (await res.json()) as AgentAuthMeResponse;
        if (me.organization) {
          setOrgLabel(
            me.organization.organizationName ||
              me.organization.organizationNumber,
          );
        }
      } catch {
        /* ignore */
      }
    };
    void loadMe();
  }, []);

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

  const handleToggleActive = async (userId: string, nextIsActive: boolean) => {
    setSubmittingKey(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/agent/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: "AGENT",
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

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            회사 사용자 관리
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {orgLabel
              ? `${orgLabel} 소속 사용자 현황을 확인하고 초대할 수 있습니다.`
              : "조직 소속 사용자 현황을 확인하고 초대할 수 있습니다."}
          </p>
          {data && !data.canManageUsers && (
            <p className="mt-2 text-xs text-amber-700">
              현재 계정은 조회/초대 권한만 있습니다. 사용자 상태 변경은 마스터만
              가능합니다.
            </p>
          )}
        </div>

        <UserInviteForm />

        <StatusMessage message={message} />

        {loading ? (
          <LoadingPanel message="사용자 현황을 불러오는 중..." card />
        ) : !data ? (
          <ErrorPanel
            message="사용자 관리 정보를 확인할 수 없습니다."
            card
            onRetry={() => void loadUsers()}
          />
        ) : (
          <UserTable
            users={data.agentUsers}
            currentUserId={data.currentUserId}
            canManageUsers={data.canManageUsers}
            summary={data.summary.agentUsers}
            submittingKey={submittingKey}
            onToggleActive={(userId, nextIsActive) =>
              void handleToggleActive(userId, nextIsActive)
            }
          />
        )}
      </div>
    </div>
  );
}
