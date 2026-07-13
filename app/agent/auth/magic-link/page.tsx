import Script from "next/script";
import Link from "next/link";
import { redirect } from "next/navigation";

type AgentMagicLinkPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function AgentMagicLinkPage({
  searchParams,
}: AgentMagicLinkPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const token = params?.token?.trim();

  if (!token) {
    redirect("/agent/auth/login?error=invalid_magic_link");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            로그인 확인 중
          </h1>
          <p className="text-sm text-gray-500">
            보안 확인을 위해 로그인 링크를 다시 제출합니다.
          </p>
          <p className="text-xs text-gray-400">
            자동으로 진행되지 않으면 아래 버튼을 눌러주세요.
          </p>
        </div>

        <form
          id="agent-magic-link-form"
          action="/api/agent/auth/magic-link"
          method="post"
          className="mt-6 space-y-3"
        >
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            로그인 계속하기
          </button>
          <Link
            href="/agent/auth/login"
            className="block text-center text-sm text-gray-500 underline underline-offset-4"
          >
            로그인 화면으로 돌아가기
          </Link>
        </form>

        <Script id="agent-magic-link-auto-submit" strategy="afterInteractive">
          {`window.requestAnimationFrame(function () {
            document.getElementById("agent-magic-link-form")?.requestSubmit();
          });`}
        </Script>
      </div>
    </div>
  );
}
