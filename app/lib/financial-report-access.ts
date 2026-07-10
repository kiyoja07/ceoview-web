import type { NextRequest } from "next/server";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import {
  resolveFinancialReportForCompanyView,
  type FinancialReportViewSelection,
} from "@/app/lib/financial-report-view";

export type FinancialReportAuthResult =
  | { error: string; status: number }
  | { view: FinancialReportViewSelection };

/**
 * 회사 측 재무 리포트 라우트 접근 제어.
 * - 연결된 에이전트: 허용 (SAVED/PUBLISHED)
 * - 해당 거래처의 회사 사용자: 허용 (PUBLISHED만 노출)
 * - 그 외(직원 세션 포함, 세션 없음): 차단
 *
 * 직원(employee)은 company 세션이 없으므로 여기서 항상 차단되며,
 * 애초에 직원 포털에는 이 라우트로의 진입점이 없다.
 */
export async function authorizeFinancialReportView(
  request: NextRequest,
  companyId: string,
): Promise<FinancialReportAuthResult> {
  const view = await resolveFinancialReportForCompanyView(request, companyId);

  if (view.isAgentView) {
    return { view };
  }

  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 };
  }

  const hasCompany = context.companies.some(
    (company) => company.id === companyId,
  );
  if (!hasCompany) {
    return { error: "접근 권한이 없는 사업자입니다.", status: 403 };
  }

  return { view };
}
