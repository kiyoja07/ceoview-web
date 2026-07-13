import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { authorizeFinancialReportView } from "@/app/lib/financial-report-access";
import { serializeFinancialReportViewSelection } from "@/app/lib/financial-report-view";

/**
 * GET /api/company/[id]/financial-report-stats
 * 게시된 재무 리포트의 요약(월별 차변/대변/수익/비용, 계정용도별, 표준계정과목/거래처 상위)을 반환한다.
 * 요약은 업로드 시점에 원본 분개장 라인으로부터 집계되어 저장된 값을 그대로 사용한다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const companyId = id;

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

    const auth = await authorizeFinancialReportView(request, companyId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { view } = auth;

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
