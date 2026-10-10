import type { NextRequest } from "next/server";
import {
  attachCompanySession,
  getSelectedCompanyIdFromRequest,
} from "@/app/lib/company-auth";
import { resolveCompanyAccessContextForUser } from "@/app/lib/company-access";
import { hashCompanyMagicLinkToken } from "@/app/lib/company-magic-link";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";
import { redirectToPath } from "@/app/lib/http-redirect";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/company/auth";
const MAGIC_LINK_PAGE_PATH = "/company/auth/magic-link";

function redirectToLoginWithError(errorCode: string) {
  return redirectToPath(LOGIN_PATH, { error: errorCode });
}

function redirectToMagicLinkPage(token: string) {
  return redirectToPath(MAGIC_LINK_PAGE_PATH, { token });
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
    return redirectToLoginWithError("expired_magic_link");
  }

  if (!magicLink.companyUser.isActive) {
    return redirectToLoginWithError("inactive_user");
  }

  const markUsedResult = await prisma.companyMagicLinkToken.updateMany({
    where: {
      id: magicLink.id,
      expiresAt: { gt: now },
      OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
    },
    data: { usedAt: now },
  });

  if (markUsedResult.count !== 1) {
    return redirectToLoginWithError("expired_magic_link");
  }

  const accessContext = await resolveCompanyAccessContextForUser({
    userId: magicLink.companyUserId,
    selectedCompanyId: getSelectedCompanyIdFromRequest(request),
  });
  const selectedCompanyId =
    accessContext?.currentCompanyId ?? magicLink.companyUser.companyId;
  const selectedCompanyAddress =
    accessContext?.company.address ?? magicLink.companyUser.company?.address ?? null;

  let redirectPath = isCompanyProfileComplete(selectedCompanyAddress)
    ? "/company/dashboard"
    : "/company/auth/onboarding";

  if (!isCompanyProfileComplete(selectedCompanyAddress)) {
    const pendingJoinRequest = await prisma.companyJoinRequest.findFirst({
      where: {
        companyUserId: magicLink.companyUserId,
        status: "PENDING",
      },
      select: { id: true },
    });
    if (pendingJoinRequest) {
      redirectPath = "/company/auth/pending";
    }
  }

  const response = redirectToPath(redirectPath, undefined, 303);
  attachCompanySession(response, magicLink.companyUserId, selectedCompanyId);
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return redirectToLoginWithError("invalid_magic_link");
  }

  return redirectToMagicLinkPage(token);
}

export async function POST(request: NextRequest) {
  try {
    const token = await readTokenFromRequest(request);
    if (!token) {
      return redirectToLoginWithError("invalid_magic_link");
    }

    return await consumeMagicLink(request, token);
  } catch (error) {
    console.error("Company magic link verify error:", error);
    return redirectToLoginWithError("magic_link_error");
  }
}
