import { NextRequest, NextResponse } from "next/server";
import { attachAgentSession } from "@/app/lib/agent-auth";
import { hashMagicLinkToken } from "@/app/lib/agent-magic-link";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/agent/auth/login";

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
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (markUsedResult.count !== 1) {
      return redirectToLoginWithError(request, "expired_magic_link");
    }

    const redirectPath = magicLink.agentUser.agentOrganizationId
      ? "/agent/company"
      : "/agent/auth/organization";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    attachAgentSession(response, magicLink.agentUserId);
    return response;
  } catch (error) {
    console.error("Agent magic link verify error:", error);
    return redirectToLoginWithError(request, "magic_link_error");
  }
}
