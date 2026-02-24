"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorResponse } from "@/types/agent/auth";
import type { UsersMessageState } from "@/types/agent/users";

export function UserInviteForm() {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<UsersMessageState>(null);

  const handleInviteSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteSending(true);
    setInviteMessage(null);

    try {
      const res = await fetch("/api/agent/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const body = (await res.json()) as ApiErrorResponse & {
        message?: string;
      };

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      if (res.status === 403) {
        setInviteMessage({
          type: "error",
          text: body.error || "초대 메일 발송 권한이 없습니다.",
        });
        return;
      }

      if (!res.ok) {
        setInviteMessage({
          type: "error",
          text: body.error || "초대 메일 발송에 실패했습니다.",
        });
        return;
      }

      setInviteMessage({
        type: "success",
        text: body.message || "초대 메일을 발송했습니다.",
      });
      setInviteEmail("");
    } catch {
      setInviteMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          소속 사용자 초대
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          초대 메일 링크를 통해 같은 조직 소속 사용자로 가입할 수 있습니다.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={handleInviteSubmit}
      >
        <input
          type="email"
          required
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="invite@company.com"
          className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
        <button
          type="submit"
          disabled={inviteSending}
          className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {inviteSending ? "발송 중..." : "초대 메일 보내기"}
        </button>
      </form>

      {inviteMessage && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            inviteMessage.type === "error"
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {inviteMessage.text}
        </div>
      )}
    </section>
  );
}
