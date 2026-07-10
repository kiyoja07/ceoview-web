import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

const REPORT_META_PREFIX = "__report_meta__:";

export type FinancialReportPublishStatus = "NONE" | "SAVED" | "PUBLISHED";

export type FinancialReportViewSelection = {
  reportId: string | null;
  uploadedAt: Date | null;
  fiscalYear: number | null;
  publishStatus: FinancialReportPublishStatus;
  isAgentView: boolean;
  companyVisible: boolean;
};

function parseUploadedByAgentUserId(memo: string | null): string | null {
  if (!memo || !memo.startsWith(REPORT_META_PREFIX)) return null;
  try {
    const parsed = JSON.parse(memo.slice(REPORT_META_PREFIX.length)) as {
      uploadedByAgentUserId?: string;
    };
    return parsed.uploadedByAgentUserId ?? null;
  } catch {
    return null;
  }
}

function canViewSavedReport(memo: string | null, agentUserId: string): boolean {
  const uploadedBy = parseUploadedByAgentUserId(memo);
  if (!uploadedBy) return true;
  return uploadedBy === agentUserId;
}

export function serializeFinancialReportViewSelection(
  selection: FinancialReportViewSelection,
) {
  return {
    publishStatus: selection.publishStatus,
    isAgentView: selection.isAgentView,
    companyVisible: selection.companyVisible,
    fiscalYear: selection.fiscalYear,
    uploadedAt: selection.uploadedAt
      ? selection.uploadedAt.toISOString()
      : null,
  };
}

// 게시된(PUBLISHED) 리포트만 노출 (company/익명 뷰)
async function getPublishedSelection(
  companyId: string,
  isAgentView: boolean,
): Promise<FinancialReportViewSelection> {
  const pointer = await prisma.companyActiveFinancialReport.findUnique({
    where: { companyId },
    select: {
      reportId: true,
      report: { select: { uploadedAt: true, fiscalYear: true } },
    },
  });

  if (!pointer) {
    return {
      reportId: null,
      uploadedAt: null,
      fiscalYear: null,
      publishStatus: "NONE",
      isAgentView,
      companyVisible: false,
    };
  }

  return {
    reportId: pointer.reportId,
    uploadedAt: pointer.report.uploadedAt,
    fiscalYear: pointer.report.fiscalYear,
    publishStatus: "PUBLISHED",
    isAgentView,
    companyVisible: true,
  };
}

/**
 * 요청자에 따라 노출할 재무 리포트를 결정한다.
 * - 연결된 에이전트: 최신 저장본(SAVED) 또는 게시본(PUBLISHED) 확인 가능
 * - 회사 사용자/익명: 게시된(PUBLISHED) 리포트만 확인 가능
 *
 * employee는 별도 포털/세션이며 이 함수를 경유하는 라우트에 접근하지 못하므로
 * 구조적으로 조회가 차단된다.
 */
export async function resolveFinancialReportForCompanyView(
  request: NextRequest,
  companyId: string,
): Promise<FinancialReportViewSelection> {
  const agentUserId = getAgentUserIdFromRequest(request);

  if (!agentUserId) {
    return getPublishedSelection(companyId, false);
  }

  const [agentUser, pointer] = await Promise.all([
    prisma.agentUser.findUnique({
      where: { id: agentUserId },
      select: { isActive: true, agentOrganizationId: true },
    }),
    prisma.companyActiveFinancialReport.findUnique({
      where: { companyId },
      select: {
        reportId: true,
        report: { select: { uploadedAt: true, fiscalYear: true } },
      },
    }),
  ]);

  if (!agentUser || !agentUser.isActive || !agentUser.agentOrganizationId) {
    return getPublishedSelection(companyId, false);
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

  if (!companyLink) {
    return getPublishedSelection(companyId, false);
  }

  const latestReports = await prisma.financialReport.findMany({
    where: { companyId, agentOrganizationId: agentUser.agentOrganizationId },
    orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
    take: 100,
    select: { id: true, uploadedAt: true, fiscalYear: true, memo: true },
  });

  for (const report of latestReports) {
    const isPublished = pointer?.reportId === report.id;

    if (isPublished) {
      return {
        reportId: report.id,
        uploadedAt: report.uploadedAt,
        fiscalYear: report.fiscalYear,
        publishStatus: "PUBLISHED",
        isAgentView: true,
        companyVisible: true,
      };
    }

    if (canViewSavedReport(report.memo, agentUserId)) {
      return {
        reportId: report.id,
        uploadedAt: report.uploadedAt,
        fiscalYear: report.fiscalYear,
        publishStatus: "SAVED",
        isAgentView: true,
        companyVisible: false,
      };
    }
  }

  if (pointer) {
    return {
      reportId: pointer.reportId,
      uploadedAt: pointer.report.uploadedAt,
      fiscalYear: pointer.report.fiscalYear,
      publishStatus: "PUBLISHED",
      isAgentView: true,
      companyVisible: true,
    };
  }

  return {
    reportId: null,
    uploadedAt: null,
    fiscalYear: null,
    publishStatus: "NONE",
    isAgentView: true,
    companyVisible: false,
  };
}
