import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  ensureCompanyAccess,
  requireAgentOrganizationId,
} from "../_lib/agent-access";

/**
 * GET /api/agent/financial-report/entries?companyId=...&reportId=...&page=1&size=50
 * 짝지은 거래 내역(차변/대변) 원장 표를 반환한다.
 * 세무대리인 전용 데이터라 거래처(company) 세션으로는 접근할 수 없다.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentOrganizationId(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const reportId = searchParams.get("reportId");

  if (!companyId) {
    return NextResponse.json(
      { error: "사업자를 선택해주세요." },
      { status: 400 },
    );
  }
  if (!reportId) {
    return NextResponse.json(
      { error: "리포트를 선택해주세요." },
      { status: 400 },
    );
  }

  const hasAccess = await ensureCompanyAccess(auth.organizationId, companyId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "접근 권한이 없는 사업자입니다." },
      { status: 403 },
    );
  }

  const report = await prisma.financialReport.findFirst({
    where: {
      id: reportId,
      companyId,
      agentOrganizationId: auth.organizationId,
    },
    select: {
      id: true,
      fiscalYear: true,
      fileName: true,
      entryCount: true,
      debitTotal: true,
      creditTotal: true,
      uploadedAt: true,
    },
  });

  if (!report) {
    return NextResponse.json(
      { error: "리포트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const size = Math.min(
    Math.max(parseInt(searchParams.get("size") ?? "50", 10) || 50, 1),
    200,
  );

  const [total, rows] = await Promise.all([
    prisma.financialReportEntry.count({ where: { reportId } }),
    prisma.financialReportEntry.findMany({
      where: { reportId },
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
    report: { ...report, uploadedAt: report.uploadedAt.toISOString() },
    rows,
    total,
    page,
    size,
  });
}
