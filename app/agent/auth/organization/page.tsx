"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  AgentAuthMeResponse,
  ApiErrorResponse,
  AuthMessageState,
  CreateOrganizationBody,
} from "@/types/agent/auth";
import type { BusinessType } from "@/types/agent/company";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function AgentOrganizationCreatePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [organizationNumber, setOrganizationNumber] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL");
  const [organizationName, setOrganizationName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessageState>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/agent/auth/login");
          return;
        }

        const data = (await res.json()) as Pick<
          AgentAuthMeResponse,
          "email" | "name" | "hasOrganization"
        >;
        if (data.hasOrganization) {
          router.replace("/agent/company");
          return;
        }

        setEmail(data.email);
        setName(data.name);
      } finally {
        setChecking(false);
      }
    };

    void checkSession();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/auth/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationNumber,
          businessType,
          organizationName: organizationName || null,
          representativeName: representativeName || null,
          openingDate: openingDate || null,
          address: address || null,
        } satisfies CreateOrganizationBody),
      });

      const data = (await res.json()) as ApiErrorResponse;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "에이전트 조직 생성에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "에이전트 조직이 생성되었습니다. 이동 중입니다.",
      });
      router.replace("/agent/company");
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isBusinessNumberValid = organizationNumber.replace(/\D/g, "").length === 10;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-sm text-gray-500">세션 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              에이전트 조직 등록
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              가입 완료: {name} ({email})
            </p>
            <p className="text-sm text-gray-500">
              서비스 사용을 위해 먼저 소속 에이전트 조직을 등록해주세요.
            </p>
          </div>
          <Link
            href="/agent/auth/logout"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            로그아웃
          </Link>
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={organizationNumber}
              onChange={(e) =>
                setOrganizationNumber(formatBusinessNumber(e.target.value))
              }
              placeholder="000-00-00000"
              className={`${inputBase} font-mono tracking-wide`}
            />
            {organizationNumber && !isBusinessNumberValid && (
              <p className="mt-1 text-xs text-amber-600">
                사업자번호 10자리를 입력해주세요.
              </p>
            )}
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
                      ? "border-blue-500 bg-blue-50 text-blue-700"
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
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="세무법인 예시"
                className={inputBase}
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
                placeholder="홍길동"
                className={inputBase}
              />
            </div>
          </div>

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
              placeholder="서울특별시 ..."
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
            disabled={loading || !isBusinessNumberValid}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "생성 중..." : "에이전트 조직 생성"}
          </button>
        </form>
      </div>
    </div>
  );
}
