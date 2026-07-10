import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { authorizeFinancialReportView } from "@/app/lib/financial-report-access";
import { serializeFinancialReportViewSelection } from "@/app/lib/financial-report-view";

/**
 * GET /api/company/[id]/financial-report?page=1&size=50
 * 게시된 재무 리포트의 짝지은 거래 내역(차변/대변) 표를 반환한다.
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const size = Math.min(
      Math.max(parseInt(searchParams.get("size") ?? "50", 10) || 50, 1),
      200,
    );

    if (!view.reportId || !view.companyVisible) {
      return NextResponse.json({
        company: entity,
        publication: serializeFinancialReportViewSelection(view),
        report: null,
        rows: [],
        total: 0,
        page,
        size,
      });
    }

    const [report, total, rows] = await Promise.all([
      prisma.financialReport.findUnique({
        where: { id: view.reportId },
        select: {
          id: true,
          fiscalYear: true,
          fileName: true,
          entryCount: true,
          debitTotal: true,
          creditTotal: true,
          uploadedAt: true,
        },
      }),
      prisma.financialReportEntry.count({ where: { reportId: view.reportId } }),
      prisma.financialReportEntry.findMany({
        where: { reportId: view.reportId },
        orderBy: { rowIndex: "asc" },
        skip: (page - 1) * size,
        take: size,
        select: {
          rowIndex: true,
          gubunja: true,
          yearMonth: true,
          entryDate: true,
          voucherNo: true,
          debitCode: true,
          debitAccount: true,
          debitAmount: true,
          debitStandardName: true,
          debitUsage: true,
          debitIsRevenue: true,
          debitIsExpense: true,
          debitPartnerName: true,
          creditCode: true,
          creditAccount: true,
          creditAmount: true,
          creditStandardName: true,
          creditPartnerName: true,
        },
      }),
    ]);

    return NextResponse.json({
      company: entity,
      publication: serializeFinancialReportViewSelection(view),
      report: report
        ? { ...report, uploadedAt: report.uploadedAt.toISOString() }
        : null,
      rows,
      total,
      page,
      size,
    });
  } catch (error) {
    console.error("재무 리포트 조회 실패:", error);
    return NextResponse.json(
      { error: "재무 리포트를 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}
