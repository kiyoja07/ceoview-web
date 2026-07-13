import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import {
  resolveFinancialReportForCompanyView,
  serializeFinancialReportViewSelection,
} from "@/app/lib/financial-report-view";

/**
 * GET /api/company/financial-report-stats
 * 로그인한 회사 사용자의 현재 선택된 회사 기준으로 재무 리포트 요약을 반환한다.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCompanyAccessContext(request);
    if (!auth) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }
    const companyId = auth.currentCompanyId;

    const entity = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, businessName: true, businessNumber: true },
    });

    if (!entity) {
      return NextResponse.json(
        { error: "사업자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const view = await resolveFinancialReportForCompanyView(
      request,
      companyId,
    );

    if (!view.reportId || !(view.companyVisible || view.isAgentView)) {
      return NextResponse.json({
        company: entity,
        publication: serializeFinancialReportViewSelection(view),
        summary: null,
        totals: null,
      });
    }

    const report = await prisma.financialReport.findUnique({
      where: { id: view.reportId },
      select: {
        fiscalYear: true,
        entryCount: true,
        debitTotal: true,
        creditTotal: true,
        summary: true,
        uploadedByAgentUserId: true,
        agentOrganization: {
          select: {
            organizationName: true,
          },
        },
      },
    });

    const agentOrganizationName =
      report?.agentOrganization.organizationName?.trim() || null;

    return NextResponse.json({
      company: entity,
      publication: {
        ...serializeFinancialReportViewSelection(view),
        agentOrganizationName,
      },
      summary: report?.summary ?? null,
      totals: report
        ? {
            fiscalYear: report.fiscalYear,
            entryCount: report.entryCount,
            debitTotal: report.debitTotal,
            creditTotal: report.creditTotal,
          }
        : null,
    });
  } catch (error) {
    console.error("재무 리포트 통계 조회 실패:", error);
    return NextResponse.json(
      { error: "재무 리포트 통계를 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}
