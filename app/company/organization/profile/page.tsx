"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  CompanyAuthMeResponse,
  CompanyAuthMessageState,
  CompanyProfileUpdateBody,
} from "@/types/company/auth";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";
const readOnlyInputBase =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";

export default function CompanyOrganizationProfilePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<CompanyAuthMessageState>(null);

  useEffect(() => {
    const load = async () => {
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

        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
      } catch {
        router.replace("/company/auth/login");
      } finally {
        setChecking(false);
      }
    };

    void load();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/company/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
        } satisfies CompanyProfileUpdateBody),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "사용자 정보 변경에 실패했습니다.",
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
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="text-sm text-gray-500">정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            내 정보 변경
          </h1>
          <p className="text-sm text-gray-500">
            이름과 연락처를 변경할 수 있습니다.
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
              className={inputBase}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              연락처
            </label>
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputBase}
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
              className={`${inputBase} ${readOnlyInputBase}`}
            />
            <p className="mt-1 text-xs text-gray-400">
              이메일은 조회만 가능하며 변경할 수 없습니다.
            </p>
          </div>

          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
