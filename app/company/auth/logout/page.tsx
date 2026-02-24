"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyLogoutState } from "@/types/company/auth";

export default function CompanyAuthLogoutPage() {
  const router = useRouter();
  const [state, setState] = useState<CompanyLogoutState>("confirm");
  const [message, setMessage] = useState("정말 로그아웃 하시겠습니까?");

  const performLogout = useCallback(async () => {
    setState("logging-out");
    setMessage("로그아웃 처리 중입니다...");

    try {
      const res = await fetch("/api/company/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        setState("error");
        setMessage("로그아웃 처리에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      setState("success");
      setMessage("로그아웃이 완료되었습니다. 로그인 화면으로 이동합니다.");
      setTimeout(() => {
        router.replace("/company/auth/login");
      }, 900);
    } catch {
      setState("error");
      setMessage("서버 연결에 실패했습니다. 다시 시도해주세요.");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">로그아웃</h1>
          <p className="mt-2 text-sm text-gray-500">{message}</p>

          {state === "confirm" && (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => void performLogout()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                로그아웃
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          )}

          {state === "logging-out" && (
            <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              잠시만 기다려주세요.
            </div>
          )}

          {state === "error" && (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => void performLogout()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                로그아웃 다시 시도
              </button>
              <Link
                href="/company/auth/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                로그인 화면으로 이동
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
