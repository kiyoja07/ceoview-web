import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";

export type CompanySalaryAuthResult =
  | { error: string; status: number }
  | { actor: "agent" | "company" };

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

async function isLinkedAgent(request: NextRequest, companyId: string) {
  const agentUserId = getAgentUserIdFromRequest(request);
  if (!agentUserId) return false;

  const agentUser = await prisma.agentUser.findUnique({
    where: { id: agentUserId },
    select: { isActive: true, agentOrganizationId: true },
  });
  if (!agentUser || !agentUser.isActive || !agentUser.agentOrganizationId) {
    return false;
  }

  const companyLink = await prisma.agentOrganizationCompany.findUnique({
    where: {
      agentOrganizationId_companyId: {
        agentOrganizationId: agentUser.agentOrganizationId,
        companyId,
      },
    },
    select: { id: true },
  });
  return Boolean(companyLink);
}

/**
 * 회사 측 급여(인건비) 라우트 접근 제어.
 * - 해당 거래처와 연결된 에이전트: 허용
 * - 해당 거래처에 소속된 회사 사용자: 허용
 * - 그 외(세션 없음, 다른 회사 사용자, 직원 세션): 차단
 *
 * 노출 범위(SAVED/PUBLISHED)는 resolveUploadForCompanyView가 별도로 결정한다.
 */
export async function authorizeCompanySalaryAccess(
  request: NextRequest,
  companyId: string,
): Promise<CompanySalaryAuthResult> {
  if (!OBJECT_ID_RE.test(companyId)) {
    return { error: "사업자를 찾을 수 없습니다.", status: 404 };
  }

  if (await isLinkedAgent(request, companyId)) {
    return { actor: "agent" };
  }

  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return getAgentUserIdFromRequest(request)
      ? { error: "접근 권한이 없는 사업자입니다.", status: 403 }
      : { error: "로그인이 필요합니다.", status: 401 };
  }

  const hasCompany = context.companies.some(
    (company) => company.id === companyId,
  );
  if (!hasCompany) {
    return { error: "접근 권한이 없는 사업자입니다.", status: 403 };
  }

  return { actor: "company" };
}
