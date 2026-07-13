import { NextRequest, NextResponse } from "next/server";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  approveCompanyJoinRequest,
  COMPANY_JOIN_REQUEST_STATUS,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: companyId, requestId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const joinRequest = await tx.companyJoinRequest.findFirst({
        where: {
          id: requestId,
          companyId,
          status: COMPANY_JOIN_REQUEST_STATUS.pending,
          company: {
            is: {
              organizationLink: {
                is: { agentOrganizationId: auth.organizationId },
              },
            },
          },
        },
        select: { id: true },
      });

      if (!joinRequest) return null;

      return approveCompanyJoinRequest(tx, {
        requestId: joinRequest.id,
        actorType: "agent",
        actorId: auth.userId,
      });
    });

    if (!result) {
      return NextResponse.json(
        { error: "승인 가능한 가입 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: result.id.toString(),
      status: result.status,
      resolvedAt: result.resolvedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Agent company join request approve error:", error);
    return NextResponse.json(
      { error: "가입 요청 승인에 실패했습니다." },
      { status: 500 },
    );
  }
}
