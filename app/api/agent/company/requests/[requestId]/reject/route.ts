import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
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

  return { userId, organizationId: user.agentOrganizationId } as const;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { requestId } = await params;
    let parsedRequestId: bigint;
    try {
      parsedRequestId = BigInt(requestId);
    } catch {
      return NextResponse.json(
        { error: "유효한 요청 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    const resolutionComment =
      body && typeof body.resolutionComment === "string"
        ? body.resolutionComment.trim()
        : "";

    if (!resolutionComment) {
      return NextResponse.json(
        { error: "반려 사유를 입력해주세요." },
        { status: 400 },
      );
    }

    const existing = await prisma.companyChangeRequest.findFirst({
      where: {
        id: parsedRequestId,
        status: "PENDING",
        company: {
          organizationLink: {
            is: { agentOrganizationId: auth.organizationId },
          },
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "처리 가능한 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    await prisma.companyChangeRequest.update({
      where: { id: parsedRequestId },
      data: {
        status: "REJECTED",
        resolutionComment,
        resolvedAt: new Date(),
        resolvedByAgentUserId: auth.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agent request reject error:", error);
    return NextResponse.json(
      { error: "요청 반려에 실패했습니다." },
      { status: 500 },
    );
  }
}
