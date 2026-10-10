import type { NextRequest } from "next/server";
import { attachAgentSession } from "@/app/lib/agent-auth";
import { hashMagicLinkToken } from "@/app/lib/agent-magic-link";
import { redirectToPath } from "@/app/lib/http-redirect";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/agent/auth/login";
const MAGIC_LINK_PAGE_PATH = "/agent/auth/magic-link";

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

async function consumeMagicLink(token: string) {
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
    return redirectToLoginWithError("expired_magic_link");
  }

  if (!magicLink.agentUser.isActive) {
    return redirectToLoginWithError("inactive_user");
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
    return redirectToLoginWithError("expired_magic_link");
  }

  const redirectPath = magicLink.agentUser.agentOrganizationId
    ? "/agent/company"
    : "/agent/auth/organization";
  const response = redirectToPath(redirectPath, undefined, 303);
  attachAgentSession(response, magicLink.agentUserId);
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

    return await consumeMagicLink(token);
  } catch (error) {
    console.error("Agent magic link verify error:", error);
    return redirectToLoginWithError("magic_link_error");
  }
}
