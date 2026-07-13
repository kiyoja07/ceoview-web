import { NextRequest, NextResponse } from "next/server";
import { attachAgentSession } from "@/app/lib/agent-auth";
import { hashMagicLinkToken } from "@/app/lib/agent-magic-link";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/agent/auth/login";
const MAGIC_LINK_PAGE_PATH = "/agent/auth/magic-link";

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

async function consumeMagicLink(request: NextRequest, token: string) {
  const tokenHash = hashMagicLinkToken(token);
  const now = new Date();

  const magicLink = await prisma.agentMagicLinkToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      agentUserId: true,
      usedAt: true,
      expiresAt: true,
      agentUser: {
        select: {
          isActive: true,
          agentOrganizationId: true,
        },
      },
    },
  });

  if (!magicLink || magicLink.usedAt || magicLink.expiresAt <= now) {
    return redirectToLoginWithError(request, "expired_magic_link");
  }

  if (!magicLink.agentUser.isActive) {
    return redirectToLoginWithError(request, "inactive_user");
  }

  const markUsedResult = await prisma.agentMagicLinkToken.updateMany({
    where: {
      id: magicLink.id,
      expiresAt: { gt: now },
      OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
    },
    data: { usedAt: now },
  });

  if (markUsedResult.count !== 1) {
    return redirectToLoginWithError(request, "expired_magic_link");
  }

  const redirectPath = magicLink.agentUser.agentOrganizationId
    ? "/agent/company"
    : "/agent/auth/organization";
  const response = NextResponse.redirect(new URL(redirectPath, request.url), {
    status: 303,
  });
  attachAgentSession(response, magicLink.agentUserId);
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
    console.error("Agent magic link verify error:", error);
    return redirectToLoginWithError(request, "magic_link_error");
  }
}
