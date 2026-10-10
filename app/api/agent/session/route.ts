import { NextRequest, NextResponse } from "next/server";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import prisma from "@/app/lib/prisma";
import type { AgentSessionResponse } from "@/types/agent/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/agent/session
 * 화면 서버 컴포넌트(레이아웃·홈)가 로그인 여부와 조직명을 확인할 때 쓴다.
 * 로그인하지 않았어도 200으로 authenticated: false를 돌려준다.
 */
export async function GET(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json<AgentSessionResponse>(
      { authenticated: false, organizationName: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  let organizationName: string | null = null;
  try {
    const user = await prisma.agentUser.findUnique({
      where: { id: userId },
      select: {
        agentOrganization: {
          select: { organizationName: true },
        },
      },
    });
    organizationName = user?.agentOrganization?.organizationName ?? null;
  } catch (error) {
    console.error("Agent session lookup error:", error);
  }

  return NextResponse.json<AgentSessionResponse>(
    { authenticated: true, organizationName },
    { headers: { "Cache-Control": "no-store" } },
  );
}
