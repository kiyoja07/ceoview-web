import Link from "next/link";
import { redirect } from "next/navigation";
import { backendGet } from "@/app/lib/backend";
import { MAGIC_LINK_TTL_MINUTES } from "@/app/lib/magic-link-ttl";
import type { AgentSessionResponse } from "@/types/agent/session";

export default async function AgentHomePage() {
  const session = await backendGet<AgentSessionResponse>("/api/agent/session");

  if (session.ok && session.data.authenticated) {
    redirect("/agent/company");
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              세무대리인 서비스
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              이메일 로그인 링크로 시작하세요. 처음이면 계정이 자동 생성됩니다.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/agent/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              로그인 링크 받기
            </Link>
            <p className="text-center text-xs text-gray-500">
              링크는 {MAGIC_LINK_TTL_MINUTES}분 동안 유효하며 1회만 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
