import { NextRequest, NextResponse } from "next/server";
import { attachCompanySession } from "@/app/lib/company-auth";
import { hashCompanyMagicLinkToken } from "@/app/lib/company-magic-link";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/company/auth";

function redirectToLoginWithError(request: NextRequest, errorCode: string) {
  const url = new URL(LOGIN_PATH, request.url);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return redirectToLoginWithError(request, "invalid_magic_link");
    }

    const tokenHash = hashCompanyMagicLinkToken(token);
    const now = new Date();

    const magicLink = await prisma.companyMagicLinkToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        companyUserId: true,
        usedAt: true,
        expiresAt: true,
        companyUser: {
          select: {
            isActive: true,
            company: {
              select: {
                address: true,
              },
            },
          },
        },
      },
    });

    if (!magicLink || magicLink.usedAt || magicLink.expiresAt <= now) {
      return redirectToLoginWithError(request, "expired_magic_link");
    }

    if (!magicLink.companyUser.isActive) {
      return redirectToLoginWithError(request, "inactive_user");
    }

    const markUsedResult = await prisma.companyMagicLinkToken.updateMany({
      where: {
        id: magicLink.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (markUsedResult.count !== 1) {
      return redirectToLoginWithError(request, "expired_magic_link");
    }

    const redirectPath = isCompanyProfileComplete(magicLink.companyUser.company?.address ?? null)
      ? "/company/dashboard"
      : "/company/auth/onboarding";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    attachCompanySession(response, magicLink.companyUserId);
    return response;
  } catch (error) {
    console.error("Company magic link verify error:", error);
    return redirectToLoginWithError(request, "magic_link_error");
  }
}
