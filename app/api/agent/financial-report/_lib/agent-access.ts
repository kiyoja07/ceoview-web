import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

export type AgentAuthResult =
  | { error: string; status: number }
  | { userId: string; organizationId: string };

// 활성 에이전트 사용자 + 소속 조직 확인 (salary upload route와 동일한 패턴)
export async function requireAgentOrganizationId(
  request: NextRequest,
): Promise<AgentAuthResult> {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 };
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 };
  }

  if (!user.agentOrganizationId) {
    return { error: "소속 에이전트 조직 등록이 필요합니다.", status: 403 };
  }

  return { userId, organizationId: user.agentOrganizationId };
}

// 해당 조직이 접근 가능한 거래처인지 확인
export async function ensureCompanyAccess(
  organizationId: string,
  companyId: string,
): Promise<boolean> {
  const link = await prisma.agentOrganizationCompany.findUnique({
    where: {
      agentOrganizationId_companyId: {
        agentOrganizationId: organizationId,
        companyId,
      },
    },
    select: { id: true },
  });
  return Boolean(link);
}
