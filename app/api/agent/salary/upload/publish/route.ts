import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { INCOME_TYPE_LABELS } from "../constants";
import { publishUpload } from "../save-services";

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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const uploadId =
      body && typeof body.uploadId === "string" ? body.uploadId.trim() : "";

    if (!uploadId) {
      return NextResponse.json(
        { error: "발행할 업로드 ID를 입력해주세요." },
        { status: 400 },
      );
    }

    try {
      const published = await publishUpload(
        auth.organizationId,
        auth.userId,
        uploadId,
      );

      return NextResponse.json({
        success: true,
        published: true,
        companyVisible: true,
        publishStatus: published.publishStatus,
        uploadId: published.uploadId,
        companyId: published.companyId,
        incomeType: published.incomeType,
        incomeTypeLabel: INCOME_TYPE_LABELS[published.incomeType],
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "발행 처리에 실패했습니다.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error) {
    console.error("Salary publish error:", error);
    return NextResponse.json(
      { error: "발행 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
