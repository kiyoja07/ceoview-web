import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import { COMPANY_ONBOARDING_PENDING_MARKER } from "@/app/lib/company-onboarding";
import {
  COMPANY_JOIN_REQUEST_STATUS,
  serializeJoinRequest,
} from "@/app/lib/company-join-requests";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const access = await resolveCompanyAccessContext(request);
    if (!access) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const isPendingUser =
      access.company.address === COMPANY_ONBOARDING_PENDING_MARKER;

    if (!isPendingUser && !access.isMaster) {
      return NextResponse.json(
        { error: "가입 요청은 마스터 사용자만 조회할 수 있습니다." },
        { status: 403 },
      );
    }

    const requests = await prisma.companyJoinRequest.findMany({
      where: isPendingUser
        ? { companyUserId: access.userId }
        : {
            companyId: access.currentCompanyId,
            status: COMPANY_JOIN_REQUEST_STATUS.pending,
          },
      orderBy: { requestedAt: "desc" },
      take: 50,
      select: {
        id: true,
        businessNumber: true,
        status: true,
        requestedAt: true,
        resolvedAt: true,
        company: {
          select: {
            id: true,
            businessNumber: true,
            businessName: true,
          },
        },
        companyUser: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      requests: requests.map(serializeJoinRequest),
      total: requests.length,
    });
  } catch (error) {
    console.error("Company join requests GET error:", error);
    return NextResponse.json(
      { error: "가입 요청 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
