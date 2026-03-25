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

function redirectTo(request: NextRequest, url: string) {
  return NextResponse.redirect(new URL(url), 308);
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

  if (audience === "public") {
    if (isLocalDevelopmentHost(hostname)) {
      return NextResponse.next();
    }

    const matchedAudience = getMatchedLegacyAudience(pathname);
    if (matchedAudience) {
      return redirectTo(
        request,
        buildUrlForAudience(matchedAudience, pathname, request),
      );
    }
    return NextResponse.next();
  }

  if (isPublicSurfacePath(pathname)) {
    return redirectTo(
      request,
      buildUrlForAudience("public", pathname, request),
    );
  }

  const currentPrefix = INTERNAL_PREFIX_BY_AUDIENCE[audience];
  if (pathname === currentPrefix || pathname.startsWith(`${currentPrefix}/`)) {
    return redirectTo(
      request,
      buildUrlForAudience(audience, pathname, request),
    );
  }

  const rewrittenPath = toInternalPath(audience, pathname);
  if (rewrittenPath === pathname) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewrittenPath;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/:path*"],
};
