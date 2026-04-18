import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildUrlForAudience,
  INTERNAL_PREFIX_BY_AUDIENCE,
  isLocalDevelopmentHost,
  isPublicSurfacePath,
  isStaticAssetPath,
  normalizePathname,
  resolveAudienceFromHost,
  toInternalPath,
} from "@/app/lib/audience-routing";
import type { Audience } from "@/types/routing";

const ROLE_AUDIENCES: Audience[] = ["agent", "company", "employee"];

function getMatchedLegacyAudience(pathname: string) {
  return ROLE_AUDIENCES.find((audience) => {
    const prefix = INTERNAL_PREFIX_BY_AUDIENCE[audience];
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function redirectTo(url: string) {
  return NextResponse.redirect(new URL(url), 308);
}

function buildRequestHeaders(
  request: NextRequest,
  pathname: string,
  audience: Audience,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ceoview-pathname", pathname);
  requestHeaders.set("x-ceoview-audience", audience);
  return requestHeaders;
}

export function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const requestHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const hostname = requestHost?.split(":")[0] ?? "";

  if (isStaticAssetPath(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const audience = resolveAudienceFromHost(requestHost);
  const requestHeaders = buildRequestHeaders(request, pathname, audience);

  if (audience === "public") {
    if (isLocalDevelopmentHost(hostname)) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    const matchedAudience = getMatchedLegacyAudience(pathname);
    if (matchedAudience) {
      return redirectTo(
        buildUrlForAudience(matchedAudience, pathname, request),
      );
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isPublicSurfacePath(pathname)) {
    return redirectTo(
      buildUrlForAudience("public", pathname, request),
    );
  }

  const currentPrefix = INTERNAL_PREFIX_BY_AUDIENCE[audience];
  if (pathname === currentPrefix || pathname.startsWith(`${currentPrefix}/`)) {
    return redirectTo(
      buildUrlForAudience(audience, pathname, request),
    );
  }

  const rewrittenPath = toInternalPath(audience, pathname);
  if (rewrittenPath === pathname) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewrittenPath;
  requestHeaders.set("x-ceoview-pathname", rewrittenPath);
  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
