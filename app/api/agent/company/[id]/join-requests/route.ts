import { NextRequest, NextResponse } from "next/server";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  COMPANY_JOIN_REQUEST_STATUS,
  serializeJoinRequest,
} from "@/app/lib/company-join-requests";
import prisma from "@/app/lib/prisma";

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { userId: user.id, organizationId: user.agentOrganizationId } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: companyId } = await params;

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const requests = await prisma.companyJoinRequest.findMany({
      where: {
        companyId,
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
    console.error("Agent company join requests GET error:", error);
    return NextResponse.json(
      { error: "가입 요청 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
