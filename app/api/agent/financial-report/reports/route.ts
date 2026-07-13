import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  ensureCompanyAccess,
  requireAgentOrganizationId,
} from "../_lib/agent-access";
import { extractPeriod } from "../_lib/period";

// GET /api/agent/financial-report/reports?companyId=...
// 거래처의 재무 리포트 목록(게시 상태 포함)
export async function GET(request: NextRequest) {
  const auth = await requireAgentOrganizationId(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json(
      { error: "사업자를 선택해주세요." },
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

  const [reports, activePointer] = await Promise.all([
    prisma.financialReport.findMany({
      where: { companyId, agentOrganizationId: auth.organizationId },
      orderBy: { uploadedAt: "desc" },
      take: 50,
      select: {
        id: true,
        fileName: true,
        fiscalYear: true,
        entryCount: true,
        debitTotal: true,
        creditTotal: true,
        uploadedAt: true,
        summary: true,
      },
    }),
    prisma.companyActiveFinancialReport.findUnique({
      where: { companyId },
      select: { reportId: true },
    }),
  ]);

  const activeReportId = activePointer?.reportId ?? null;

  return NextResponse.json({
    activeReportId,
    reports: reports.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      fiscalYear: r.fiscalYear,
      period: extractPeriod(r.summary),
      entryCount: r.entryCount,
      debitTotal: r.debitTotal,
      creditTotal: r.creditTotal,
      uploadedAt: r.uploadedAt.toISOString(),
      publishStatus: r.id === activeReportId ? "PUBLISHED" : "SAVED",
    })),
  });
}
