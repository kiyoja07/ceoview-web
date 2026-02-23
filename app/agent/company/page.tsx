"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AgentCompanyListItem } from "@/types/agent/company";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

const CURRENT_YYYYMM = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

export default function CompanyListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const created = searchParams.get("created") === "1";

  const [companies, setCompanies] = useState<AgentCompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/agent/company");
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }
        if (!res.ok) throw new Error("목록 조회 실패");
        const data = (await res.json()) as AgentCompanyListItem[];
        setCompanies(data);
      } catch {
        setError("사업자 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void fetchCompanies();
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
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
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  거래처 목록
                </h1>
                <p className="text-sm text-gray-500">
                  등록된 거래처{" "}
                  {!loading && !error ? `${companies.length}건` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/agent/company/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99]"
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                신규 거래처 등록
              </Link>
            </div>
          </div>
        </div>

        {/* Toast */}
        {created && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            거래처 등록이 완료되었습니다.
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5">
            <div className="flex flex-col items-center justify-center gap-3">
              <svg
                className="h-8 w-8 animate-spin text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
              >
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
              <p className="text-sm text-gray-500">불러오는 중…</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5">
            <div className="flex flex-col items-center justify-center gap-2">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <svg
                  className="h-7 w-7 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  등록된 거래처가 없습니다
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  신규 거래처 등록 버튼을 눌러 거래처를 등록하세요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    사업자번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    상호명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    구분
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    대표자명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    개업일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    등록일
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="transition-colors hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                      {formatBusinessNumber(company.businessNumber)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {company.businessName || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          company.businessType === "INDIVIDUAL"
                            ? "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
                            : "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20"
                        }`}
                      >
                        {company.businessType === "INDIVIDUAL"
                          ? "개인"
                          : "법인"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {company.representativeName || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-500">
                      {company.openingDate ? (
                        new Date(company.openingDate).toLocaleDateString(
                          "ko-KR",
                        )
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-500">
                      {new Date(company.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/company/${company.id}/salary?page=1&accrualYm=${CURRENT_YYYYMM}&paymentYm=${CURRENT_YYYYMM}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 transition-all hover:bg-blue-100 active:scale-[0.97]"
                        >
                          급여 내역
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
