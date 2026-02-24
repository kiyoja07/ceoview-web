"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAuthMeResponse } from "@/types/company/auth";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyAuthMeResponse | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const data = (await res.json()) as CompanyAuthMeResponse;
        setProfile(data);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  const companyName = useMemo(() => {
    if (!profile?.company) return "";
    return profile.company.businessName || formatBusinessNumber(profile.company.businessNumber);
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
        <p className="text-sm text-gray-500">사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!profile?.company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
        <p className="text-sm text-gray-500">회사 정보를 확인할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Company 대시보드
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {profile.name} 님, {companyName}
            </p>
          </div>
          <Link
            href="/company/auth/logout"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            로그아웃
          </Link>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm font-medium text-gray-700">회사 정보</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
            <p>사업자번호: {formatBusinessNumber(profile.company.businessNumber)}</p>
            <p>사업자구분: {profile.company.businessType === "INDIVIDUAL" ? "개인" : "법인"}</p>
            <p>상호명: {profile.company.businessName || "-"}</p>
            <p>대표자명: {profile.company.representativeName || "-"}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm font-medium text-gray-700">바로가기</p>
          <div className="mt-3">
            <Link
              href={`/company/${profile.company.id}/salary`}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              급여 내역 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
