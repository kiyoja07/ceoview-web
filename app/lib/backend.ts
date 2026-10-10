import { headers } from "next/headers";

/**
 * 화면 서버 컴포넌트에서 backend API를 호출하는 헬퍼.
 *
 * - BACKEND_URL(ceoview-backend 주소)로 보낸다. 없으면 현재 요청의 origin으로 보내며,
 *   이 경우 next.config.ts의 /api/* rewrite를 한 번 더 거친다.
 * - 브라우저가 보낸 cookie 헤더를 그대로 전달해 backend가 세션을 확인하게 한다.
 */
async function resolveBackendBaseUrl() {
  const configured = process.env.BACKEND_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    throw new Error("BACKEND_URL이 없고 요청 host도 확인할 수 없습니다.");
  }
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) || host.includes(".localhost")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

export type BackendResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: null };

export async function backendGet<T>(path: string): Promise<BackendResult<T>> {
  const headerStore = await headers();
  const baseUrl = await resolveBackendBaseUrl();
  const cookie = headerStore.get("cookie");

  const requestHeaders: Record<string, string> = {};
  if (cookie) requestHeaders.cookie = cookie;

  const response = await fetch(`${baseUrl}${path}`, {
    headers: requestHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, status: response.status, data: null };
  }

  return { ok: true, status: response.status, data: (await response.json()) as T };
}
