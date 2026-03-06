"use client";

import { useState } from "react";

const DISMISSED_KEY = "agent-company-onboarding-dismissed";

export default function OnboardingGuide() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISSED_KEY) === "1";
  });

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-6 shadow-sm ring-1 ring-blue-100">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 rounded-lg p-1 text-gray-400 transition hover:bg-white/60 hover:text-gray-600"
        aria-label="닫기"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">시작 가이드</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            거래처를 등록하면 거래처의 급여를 시스템으로 만들어 거래처에 제공할
            수 있습니다.
          </p>

          <div className="mt-4 flex flex-col gap-2.5 text-xs text-gray-500 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                1
              </span>
              <span>거래처 등록</span>
            </div>
            <svg
              className="hidden h-3 w-3 text-gray-300 sm:block"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                2
              </span>
              <span>급여 엑셀 업로드</span>
            </div>
            <svg
              className="hidden h-3 w-3 text-gray-300 sm:block"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                3
              </span>
              <span>거래처에 급여 발행</span>
            </div>
          </div>

          {/* <div className="mt-4">
            <Link
              href="/agent/company/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              첫 거래처 등록하기
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
