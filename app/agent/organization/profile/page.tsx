"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  AgentAuthMeResponse,
  ApiErrorResponse,
  AuthMessageState,
} from "@/types/agent/auth";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

export default function AgentProfilePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<AuthMessageState>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (!res.ok) {
          throw new Error("조회 실패");
        }

        const data = (await res.json()) as AgentAuthMeResponse;
        if (!data.hasOrganization) {
          router.replace("/agent/auth/organization");
          return;
        }

        setName(data.name ?? "");
        setPhone(data.phone ?? "");
      } catch {
        setMessage({
          type: "error",
          text: "내 정보를 불러오지 못했습니다.",
        });
      } finally {
        setChecking(false);
      }
    };

    void loadProfile();
  }, [router]);

  const submitLabel = useMemo(
    () => (saving ? "저장 중..." : "내 정보 저장"),
    [saving],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone || null,
        }),
      });

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "내 정보 저장에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "내 정보가 수정되었습니다.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-agent-bg">
        <div className="text-sm text-gray-500">정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-agent-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            내 정보 변경
          </h1>
          <p className="text-sm text-gray-500">
            이름과 휴대폰 번호를 수정할 수 있습니다.
          </p>
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              className={inputBase}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              휴대폰 번호
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="010-0000-0000"
              className={inputBase}
            />
          </div>

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
