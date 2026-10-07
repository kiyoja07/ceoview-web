"use client";

import { useState } from "react";
import type {
  PayslipViewErrorResponse,
  PayslipViewResponse,
} from "@/types/payslip";
import { PayslipViewer } from "./PayslipViewer";

interface PayslipAccessGateProps {
  token: string;
}

/**
 * 1회용 급여명세서 링크의 열람 확인 화면.
 * 링크 미리보기·보안 스캐너의 GET 요청으로 토큰이 소진되지 않도록
 * 사용자가 버튼을 눌렀을 때만 POST로 토큰을 소진하고 명세서를 불러온다.
 */
export function PayslipAccessGate({ token }: PayslipAccessGateProps) {
  const [view, setView] = useState<PayslipViewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/public/payslip/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      const data = (await res.json()) as
        | PayslipViewResponse
        | PayslipViewErrorResponse;

      if (!res.ok || "error" in data) {
        setError(
          "error" in data
            ? data.error
            : "급여명세서를 불러오지 못했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      setView(data);
    } catch {
      setError("급여명세서를 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (view) {
    return <PayslipViewer {...view} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-950/5">
        <p className="text-sm font-medium text-blue-700">급여명세서 열람</p>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">
          급여명세서가 도착했습니다
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          보안을 위해 이 링크는 1회만 열람할 수 있습니다.
          <br />
          아래 버튼을 누르면 급여명세서가 표시되고 PDF가 내려받아집니다.
        </p>
        <button
          type="button"
          onClick={handleOpen}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "불러오는 중..." : "급여명세서 열람하기"}
        </button>
        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
