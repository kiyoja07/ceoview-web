"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  AgentAuthMeResponse,
  AuthMessageState,
  AuthResponse,
} from "@/types/agent/auth";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

function AgentAuthLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<AuthMessageState>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as Pick<
          AgentAuthMeResponse,
          "hasOrganization"
        >;
        router.replace(
          data.hasOrganization ? "/agent/company" : "/agent/auth/organization",
        );
      } finally {
        setChecking(false);
      }
    };

    void checkSession();
  }, [router]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    const errorTextMap: Record<string, string> = {
      invalid_magic_link: "로그인 링크가 올바르지 않습니다.",
      expired_magic_link: "로그인 링크가 만료되었거나 이미 사용되었습니다.",
      inactive_user: "비활성화된 계정입니다. 관리자에게 문의해주세요.",
      magic_link_error: "로그인 처리 중 오류가 발생했습니다.",
    };

    setMessage({
      type: "error",
      text: errorTextMap[error] || "로그인 링크 검증에 실패했습니다.",
    });
  }, [searchParams]);

  const submitLabel = useMemo(
    () => (loading ? "링크 발송 중..." : "로그인 링크 보내기"),
    [loading],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as AuthResponse;
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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-sm text-gray-500">세션 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center p-6">
        <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold tracking-wide text-gray-900">
              세무대리인 플랫폼
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-snug tracking-tight text-blue-600">
              거래처에 시스템까지
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-500">
              급여 결과만 전달하던 시대는 끝났습니다.
              <br />
              거래처 사장님과 직원 모두가 직접 사용하는 고객용 시스템을 지금
              바로 시작하세요.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  title: "거래처 등록 · 관리",
                  desc: "거래처 목록과 운영 요청을 한 화면에서",
                },
                {
                  title: "급여 업로드 · 명세서 발급",
                  desc: "대장 업로드부터 직원 명세서 발송까지",
                },
                {
                  title: "사장님 대시보드 · 직원 포털",
                  desc: "거래처에 제공되는 전용 화면까지 자동 세팅",
                },
                {
                  title: "모든 기능 무료",
                  desc: "가입비·월 이용료 없이 바로 시작할 수 있습니다",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
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
                  세무대리인으로 무료 시작
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  이메일로 로그인/회원가입 링크를 받으세요. <br />
                  처음이면 계정이 자동으로 생성됩니다.
                </p>
              </div>

              {/* 모바일 전용 마케팅 배너 */}
              <div className="mb-5 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3 lg:hidden">
                <p className="text-center text-sm font-medium text-blue-700">
                  거래처에 시스템까지 제공하는 세무대리인
                </p>
                <p className="mt-0.5 text-center text-xs text-blue-600/70">
                  모든 기능 무료 · 가입 즉시 사용 가능
                </p>
              </div>

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
                  />
                </div>

                <p className="text-center text-xs leading-relaxed text-gray-400">
                  로그인 링크로 접속하면{" "}
                  <a href="#" className="underline hover:text-gray-600">
                    이용약관
                  </a>{" "}
                  및{" "}
                  <a href="#" className="underline hover:text-gray-600">
                    개인정보처리방침
                  </a>
                  에 동의한 것으로 봅니다.
                </p>

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
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {submitLabel}
                </button>

                <p className="text-center text-xs text-gray-500">
                  링크는 15분간 유효하며 1회만 사용할 수 있습니다.
                </p>
                <p className="text-center text-xs text-gray-500">
                  첫 로그인 후 소속 조직 정보를 입력하면 바로 사용 가능합니다.
                </p>
              </form>

              <div className="mt-4 border-t border-gray-100 pt-4 text-center">
                <Link
                  href="/"
                  className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentAuthLoginPage() {
  return (
    <Suspense>
      <AgentAuthLoginPageInner />
    </Suspense>
  );
}
