import { NextRequest, NextResponse } from "next/server";
import { attachEmployeeSession } from "@/app/lib/employee-auth";
import { hashEmployeeMagicLinkToken } from "@/app/lib/employee-magic-link";
import prisma from "@/app/lib/prisma";

const LOGIN_PATH = "/employee/auth/login";

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

    const tokenHash = hashEmployeeMagicLinkToken(token);
    const now = new Date();

    const magicLink = await prisma.employeeMagicLinkToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        employeeUserId: true,
        usedAt: true,
        expiresAt: true,
        employeeUser: {
          select: {
            isActive: true,
            employee: {
              select: {
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!magicLink || magicLink.usedAt || magicLink.expiresAt <= now) {
      return redirectToLoginWithError(request, "expired_magic_link");
    }

    if (!magicLink.employeeUser.isActive || magicLink.employeeUser.employee.deletedAt) {
      return redirectToLoginWithError(request, "inactive_user");
    }

    const markUsedResult = await prisma.employeeMagicLinkToken.updateMany({
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

    const response = NextResponse.redirect(new URL("/employee", request.url));
    attachEmployeeSession(response, magicLink.employeeUserId);
    return response;
  } catch (error) {
    console.error("Employee magic link verify error:", error);
    return redirectToLoginWithError(request, "magic_link_error");
  }
}
