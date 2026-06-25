import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { serializeCompanyChangeRequest } from "@/app/lib/company-change-request";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
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

  return { organizationId: user.agentOrganizationId } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { requestId } = await params;
    let parsedRequestId: string;
    try {
      parsedRequestId = requestId;
    } catch {
      return NextResponse.json(
        { error: "유효한 요청 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const item = await prisma.companyChangeRequest.findFirst({
      where: {
        id: parsedRequestId,
        company: {
          organizationLink: {
            is: { agentOrganizationId: auth.organizationId },
          },
        },
      },
      include: {
        company: {
          select: {
            id: true,
            businessNumber: true,
            businessName: true,
          },
        },
        requestedByCompanyUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedByAgentUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      item: serializeCompanyChangeRequest(item),
    });
  } catch (error) {
    console.error("Agent request detail GET error:", error);
    return NextResponse.json(
      { error: "요청 상세를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}
