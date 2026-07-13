"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoading } from "@/app/_components/ui/PageState";
import type {
  CompanyAuthMeResponse,
  CompanyAuthMessageState,
  CompanyAuthResponse,
  CompanyLoginBody,
} from "@/types/company/auth";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow";

type ContactType = "email" | "phone";

function normalizePhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function CompanyAuthLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contactType, setContactType] = useState<ContactType>("email");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState<CompanyAuthMessageState>(null);
  const [hideUrlError, setHideUrlError] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as CompanyAuthMeResponse;
        router.replace(
          data.profileComplete || data.companies.length > 1
            ? "/company/dashboard"
            : "/company/auth/onboarding",
        );
      } finally {
        setChecking(false);
      }
    };

    void checkSession();
  }, [router]);

  const urlErrorMessage = useMemo<CompanyAuthMessageState>(() => {
    if (hideUrlError) return null;

    const error = searchParams.get("error");
    if (!error) return null;

    const errorTextMap: Record<string, string> = {
      invalid_magic_link: "로그인 링크가 올바르지 않습니다.",
      expired_magic_link: "로그인 링크가 만료되었거나 이미 사용되었습니다.",
      inactive_user: "비활성화된 계정입니다. 관리자에게 문의해주세요.",
      magic_link_error: "로그인 처리 중 오류가 발생했습니다.",
    };

    return {
      type: "error",
      text: errorTextMap[error] || "로그인 링크 검증에 실패했습니다.",
    };
  }, [hideUrlError, searchParams]);

  const visibleMessage = message ?? urlErrorMessage;

  const submitLabel = useMemo(
    () => (loading ? "링크 발송 중..." : "로그인 링크 보내기"),
    [loading],
  );

  const helperText = useMemo(() => {
    if (contactType === "email") {
      return "이메일로 로그인 링크를 받으세요. 처음이면 계정이 자동으로 생성됩니다.";
    }
    return "전화번호로 로그인 링크를 받으세요. 처음이면 계정이 자동으로 생성됩니다.";
  }, [contactType]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setHideUrlError(true);

    try {
      const payload: CompanyLoginBody = {
        contactType,
        contact,
      };

      const res = await fetch("/api/company/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as CompanyAuthResponse;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "로그인 링크 발송에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text:
          data.message ||
          (contactType === "email"
            ? "입력한 이메일로 로그인 링크를 보냈습니다. 메일함을 확인해주세요."
            : "입력한 전화번호로 로그인 링크를 보냈습니다. 문자함을 확인해주세요."),
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
    return <PageLoading message="세션 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center p-6">
        <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-center">
          {/* 마케팅 영역 */}
          <div className="hidden lg:block">
            <p className="text-sm font-semibold tracking-wide text-emerald-600">
              우리 회사 급여 관리 시스템
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-snug tracking-tight text-gray-900">
              급여 명세서부터 직원 관리까지
              <br />
              <span className="text-emerald-600">한 곳에서 간편하게</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-500">
              엑셀로 돌려보던 급여 관리, 이제 끝.
              <br />
              사장님 전용 대시보드에서 직원 현황과 급여를 한눈에 확인하세요.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  title: "급여 명세서 자동 발급",
                  desc: "원 클릭으로 직원에게 자동 전달",
                },
                {
                  title: "직원 현황 한눈에",
                  desc: "입·퇴사, 급여 이력을 대시보드에서 바로 확인",
                },
                {
                  title: "직원 급여 포털",
                  desc: "직원이 직접 명세서를 조회하고 정보를 수정",
                },
                {
                  title: "모든 기능 무료",
                  desc: "가입비·월 이용료 없이 바로 시작할 수 있습니다",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 로그인 폼 영역 */}
          <div className="w-full max-w-lg justify-self-center lg:justify-self-end">
            <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  사업장 계정으로 무료 시작
                </h1>
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
              </div>

              {/* 모바일 전용 마케팅 배너 */}
              <div className="mb-5 rounded-lg bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 lg:hidden">
                <p className="text-center text-sm font-medium text-emerald-700">
                  급여 명세서부터 직원 관리까지 한 곳에서
                </p>
                <p className="mt-0.5 text-center text-xs text-emerald-600/70">
                  세무대리인이 제공하는 무료 시스템 · 가입 즉시 사용 가능
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    로그인 방식
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setContactType("email");
                        setContact("");
                        setMessage(null);
                        setHideUrlError(true);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        contactType === "email"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      이메일
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactType("phone");
                        setContact("");
                        setMessage(null);
                        setHideUrlError(true);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        contactType === "phone"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      전화번호
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {contactType === "email" ? "이메일" : "전화번호"}
                  </label>
                  <input
                    type={contactType === "email" ? "email" : "tel"}
                    required
                    value={contact}
                    onChange={(e) => {
                      setHideUrlError(true);
                      setContact(
                        contactType === "email"
                          ? e.target.value
                          : normalizePhoneInput(e.target.value),
                      );
                    }}
                    className={inputBase}
                    placeholder={
                      contactType === "email"
                        ? "name@company.com"
                        : "010-0000-0000"
                    }
                  />
                </div>

                {visibleMessage && (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      visibleMessage.type === "error"
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : "border border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {visibleMessage.text}
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
                  링크는 15분간 유효하며 1회만 사용할 수 있습니다
                </p>

                <p className="text-center text-xs text-gray-500">
                  첫 로그인 후 회사 정보를 입력하면 바로 사용할 수 있습니다
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyAuthLoginPage() {
  return (
    <Suspense>
      <CompanyAuthLoginPageInner />
    </Suspense>
  );
}
