import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAgentOrganizationId } from "../_lib/agent-access";
import { extractPeriod } from "../_lib/period";

/**
 * GET /api/agent/financial-report/dashboard
 *
 * Returns:
 * - summary: overall stats (total companies, companies with reports, published count, etc.)
 * - companies: per-company financial report status (latest saved report + published report)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const companies = await prisma.company.findMany({
      where: {
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
      },
      orderBy: { businessName: "asc" },
    });

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalCompanies: 0,
          companiesWithReports: 0,
          companiesPublished: 0,
          totalReports: 0,
        },
        companies: [],
      });
    }

    const companyIds = companies.map((c) => c.id);

    const [reports, activePointers] = await Promise.all([
      prisma.financialReport.findMany({
        where: {
          companyId: { in: companyIds },
          agentOrganizationId: auth.organizationId,
        },
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          companyId: true,
          fileName: true,
          fiscalYear: true,
          entryCount: true,
          debitTotal: true,
          creditTotal: true,
          uploadedAt: true,
          summary: true,
        },
      }),
      prisma.companyActiveFinancialReport.findMany({
        where: { companyId: { in: companyIds } },
        select: { companyId: true, reportId: true, updatedAt: true },
      }),
    ]);

    const reportById = new Map(reports.map((r) => [r.id, r]));

    // companyId -> latest report (reports are already sorted desc by uploadedAt)
    const latestReportMap = new Map<string, (typeof reports)[number]>();
    const reportCountMap = new Map<string, number>();
    for (const report of reports) {
      const key = report.companyId;
      reportCountMap.set(key, (reportCountMap.get(key) ?? 0) + 1);
      if (!latestReportMap.has(key)) {
        latestReportMap.set(key, report);
      }
    }

    const activePointerMap = new Map(
      activePointers.map((p) => [p.companyId, p]),
    );

    let companiesWithReports = 0;
    let companiesPublished = 0;

    const companyResults = companies.map((company) => {
      const latestReport = latestReportMap.get(company.id) ?? null;
      const reportCount = reportCountMap.get(company.id) ?? 0;
      const activePointer = activePointerMap.get(company.id) ?? null;
      const activeReport = activePointer
        ? (reportById.get(activePointer.reportId) ?? null)
        : null;

      if (reportCount > 0) companiesWithReports++;
      if (activeReport) companiesPublished++;

      return {
        id: company.id,
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessName: company.businessName,
        representativeName: company.representativeName,
        reportCount,
        latestReport: latestReport
          ? {
              id: latestReport.id,
              fileName: latestReport.fileName,
              fiscalYear: latestReport.fiscalYear,
              period: extractPeriod(latestReport.summary),
              entryCount: latestReport.entryCount,
              debitTotal: latestReport.debitTotal,
              creditTotal: latestReport.creditTotal,
              uploadedAt: latestReport.uploadedAt.toISOString(),
            }
          : null,
        activeReport: activeReport
          ? {
              id: activeReport.id,
              fileName: activeReport.fileName,
              fiscalYear: activeReport.fiscalYear,
              period: extractPeriod(activeReport.summary),
              uploadedAt: activePointer!.updatedAt.toISOString(),
            }
          : null,
        isPublished: !!activeReport,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalCompanies: companies.length,
        companiesWithReports,
        companiesPublished,
        totalReports: reports.length,
      },
      companies: companyResults,
    });
  } catch (error) {
    console.error("Financial report dashboard error:", error);
    return NextResponse.json(
      { error: "재무리포트 현황 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
