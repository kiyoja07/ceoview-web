import { NextResponse } from "next/server";

/**
 * 같은 호스트 기준 상대 경로로 리다이렉트한다.
 *
 * web이 `/api/*`를 backend로 프록시하므로, backend에서 `request.url`로 절대 URL을 만들면
 * 브라우저가 backend 주소로 이동해 버린다. 상대 경로 `Location`은 브라우저가
 * 실제로 접속한 웹 호스트를 기준으로 해석하므로 프록시 여부와 관계없이 안전하다.
 */
export function redirectToPath(
  path: string,
  searchParams?: Record<string, string>,
  status = 307,
) {
  const query = searchParams ? `?${new URLSearchParams(searchParams)}` : "";
  return new NextResponse(null, {
    status,
    headers: { Location: `${path}${query}` },
  });
}
