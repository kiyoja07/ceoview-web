"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  CompanyAuthMessageState,
  CompanyAuthResponse,
} from "@/types/company/auth";

type InviteInfo = {
  company: {
    id: string;
    businessNumber: string;
    businessName: string | null;
    businessType: string;
    representativeName: string | null;
  };
  contactType: "email" | "phone";
  contact: string;
  role: string;
  expiresAt: string;
};

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";

export default function CompanySignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get("invite") || null;

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!inviteToken);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<CompanyAuthMessageState>(null);

  // 초대 토큰이 없으면 로그인으로 리다이렉트
  useEffect(() => {
    if (!inviteToken) {
      router.replace("/company/auth/login");
    }
  }, [inviteToken, router]);

  // 초대 토큰 검증
  useEffect(() => {
    if (!inviteToken) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const res = await fetch(
          `/api/company/auth/invite-verify?token=${encodeURIComponent(inviteToken)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          const body = await res.json();
          setInviteError(body.error || "초대 링크가 유효하지 않습니다.");
          return;
        }

        const data = (await res.json()) as InviteInfo;
        setInviteInfo(data);

        // 이메일 초대인 경우 이메일 미리 입력
        if (data.contactType === "email") {
          setEmail(data.contact);
        }
      } catch {
        setInviteError("초대 정보를 확인할 수 없습니다.");
      } finally {
        setVerifying(false);
      }
    };

    void verify();
  }, [inviteToken]);

  const companyLabel = useMemo(() => {
    if (!inviteInfo) return "";
    return (
      inviteInfo.company.businessName ||
      formatBusinessNumber(inviteInfo.company.businessNumber)
    );
  }, [inviteInfo]);

  const submitLabel = useMemo(
    () => (loading ? "링크 발송 중..." : "로그인 링크 보내기"),
    [loading],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/company/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken,
          email,
        }),
      });

      const data = (await res.json()) as CompanyAuthResponse;

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "가입 처리에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text:
          data.message ||
          "입력한 이메일로 로그인 링크를 보냈습니다. 메일함을 확인해주세요.",
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

  if (!inviteToken) {
    return null;
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="text-sm text-gray-500">초대 정보 확인 중...</div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">초대 링크 오류</h2>
          <p className="mt-2 text-sm text-red-600">{inviteError}</p>
          <button
            type="button"
            onClick={() => router.push("/company/auth/login")}
            className="mt-5 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              거래처 초대 가입
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              이메일로 로그인 링크를 받아 거래처에 참여하세요.
            </p>
          </div>

          {/* 거래처 정보 */}
          {inviteInfo && (
            <div className="mb-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">
                {companyLabel}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">
                사업자번호:{" "}
                {formatBusinessNumber(inviteInfo.company.businessNumber)}
              </p>
              {inviteInfo.company.representativeName && (
                <p className="mt-0.5 text-xs text-emerald-600">
                  대표자: {inviteInfo.company.representativeName}
                </p>
              )}
              <p className="mt-1.5 text-xs text-emerald-500">
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                  {inviteInfo.role.toUpperCase()}
                </span>{" "}
                권한으로 초대됨
              </p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBase}
                placeholder="name@company.com"
                readOnly={inviteInfo?.contactType === "email"}
              />
              {inviteInfo?.contactType === "email" && (
                <p className="mt-1 text-xs text-gray-400">
                  초대된 이메일 주소입니다.
                </p>
              )}
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

            <p className="text-center text-xs text-gray-500">
              링크는 15분간 유효하며 1회만 사용할 수 있습니다.
            </p>

            <p className="text-center text-xs text-gray-500">
              이미 계정이 있으신가요?{" "}
              <a
                href="/company/auth/login"
                className="font-medium text-emerald-600 hover:underline"
              >
                로그인
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
