import { NextRequest, NextResponse } from "next/server";
import {
  attachCompanySession,
  getSelectedCompanyIdFromRequest,
} from "@/app/lib/company-auth";
import { resolveCompanyAccessContextForUser } from "@/app/lib/company-access";
import { hashCompanyMagicLinkToken } from "@/app/lib/company-magic-link";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/company/auth";
const MAGIC_LINK_PAGE_PATH = "/company/auth/magic-link";

function redirectToLoginWithError(request: NextRequest, errorCode: string) {
  const url = new URL(LOGIN_PATH, request.url);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

function redirectToMagicLinkPage(request: NextRequest, token: string) {
  const url = new URL(MAGIC_LINK_PAGE_PATH, request.url);
  url.searchParams.set("token", token);
  return NextResponse.redirect(url);
}

async function readTokenFromRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { token?: string };
    return body.token?.trim() ?? "";
  }

  const formData = await request.formData();
  const value = formData.get("token");
  return typeof value === "string" ? value.trim() : "";
}

async function consumeMagicLink(
  request: NextRequest,
  token: string,
) {
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
          companyId: true,
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

  const accessContext = await resolveCompanyAccessContextForUser({
    userId: magicLink.companyUserId,
    selectedCompanyId: getSelectedCompanyIdFromRequest(request),
  });
  const selectedCompanyId =
    accessContext?.currentCompanyId ?? magicLink.companyUser.companyId;
  const selectedCompanyAddress =
    accessContext?.company.address ?? magicLink.companyUser.company?.address ?? null;

  const redirectPath = isCompanyProfileComplete(selectedCompanyAddress)
    ? "/company/dashboard"
    : "/company/auth/onboarding";
  const response = NextResponse.redirect(new URL(redirectPath, request.url), {
    status: 303,
  });
  attachCompanySession(response, magicLink.companyUserId, selectedCompanyId);
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return redirectToLoginWithError(request, "invalid_magic_link");
  }

  return redirectToMagicLinkPage(request, token);
}

export async function POST(request: NextRequest) {
  try {
    const token = await readTokenFromRequest(request);
    if (!token) {
      return redirectToLoginWithError(request, "invalid_magic_link");
    }

    return await consumeMagicLink(request, token);
  } catch (error) {
    console.error("Company magic link verify error:", error);
    return redirectToLoginWithError(request, "magic_link_error");
  }
}
