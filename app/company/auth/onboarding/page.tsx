"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  CompanyAuthMeResponse,
  CompanyAuthMessageState,
  CompanyAuthResponse,
  CompanyOnboardingBody,
} from "@/types/company/auth";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function CompanyAuthOnboardingPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<"INDIVIDUAL" | "CORPORATION">(
    "INDIVIDUAL",
  );
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [address, setAddress] = useState("");

  const [message, setMessage] = useState<CompanyAuthMessageState>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const data = (await res.json()) as CompanyAuthMeResponse;
        if (data.profileComplete) {
          router.replace("/company/dashboard");
          return;
        }

        setName(data.name || "");
        setPhone(data.phone || "");
        setBusinessType(data.company?.businessType || "INDIVIDUAL");
      } finally {
        setChecking(false);
      }
    };

    void checkSession();
  }, [router]);

  const submitLabel = useMemo(
    () => (loading ? "저장 중..." : "온보딩 완료"),
    [loading],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/company/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          businessNumber,
          businessType,
          businessName,
          representativeName,
          openingDate,
          address,
        } satisfies CompanyOnboardingBody),
      });

      const data = (await res.json()) as CompanyAuthResponse;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "온보딩 저장에 실패했습니다.",
        });
        return;
      }

      router.replace(data.redirectTo || "/company/dashboard");
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
        <div className="text-sm text-gray-500">세션 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Company 온보딩
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            처음 로그인하셨네요. 서비스 사용을 위해 기본 정보를 완료해주세요.
          </p>
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                연락처
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputBase}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={businessNumber}
              onChange={(e) => setBusinessNumber(formatBusinessNumber(e.target.value))}
              className={`${inputBase} font-mono tracking-wide`}
              placeholder="000-00-00000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자구분 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["INDIVIDUAL", "CORPORATION"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                    businessType === value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={businessType === value}
                    onChange={() => setBusinessType(value)}
                  />
                  {value === "INDIVIDUAL" ? "개인" : "법인"}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                상호명
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputBase}
                placeholder="예시 상호"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                대표자명
              </label>
              <input
                type="text"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                className={inputBase}
                placeholder="홍길동"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                개업일
              </label>
              <input
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className={inputBase}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                주소
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputBase}
                placeholder="서울특별시 ..."
              />
            </div>
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
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
