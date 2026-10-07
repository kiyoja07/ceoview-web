import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

export type MessageApiAuthResult =
  | { error: string; status: number }
  | { agentUserId: string };

/**
 * /api/messages/* 접근 제어.
 * 임의 수신자에게 발송할 수 있는 범용 API이므로
 * 조직에 소속된 활성 에이전트 세션만 허용한다.
 */
export async function authorizeMessageApiRequest(
  request: NextRequest,
): Promise<MessageApiAuthResult> {
  const agentUserId = getAgentUserIdFromRequest(request);
  if (!agentUserId) {
    return { error: "로그인이 필요합니다.", status: 401 };
  }

  const agentUser = await prisma.agentUser.findUnique({
    where: { id: agentUserId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!agentUser || !agentUser.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 };
  }

  if (!agentUser.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    };
  }

  return { agentUserId };
}
