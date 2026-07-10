import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import type { AccountCatalogRow, ParsedFinancialReport } from "./types";

const REPORT_META_PREFIX = "__report_meta__:";

export function buildReportMemo(agentUserId: string): string {
  return `${REPORT_META_PREFIX}${JSON.stringify({
    uploadedByAgentUserId: agentUserId.toString(),
  })}`;
}

export function parseUploadedByAgentUserId(memo: string | null): string | null {
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

export function computeChecksum(bytes: ArrayBuffer): string {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

// 계정과목 매핑 저장 (조직 단위 재사용 카탈로그)
export async function saveAccountCatalog(params: {
  organizationId: string;
  agentUserId: string;
  name: string;
  sourceFileName: string | null;
  checksum: string | null;
  rows: AccountCatalogRow[];
}): Promise<{ catalogId: string; entryCount: number }> {
  const { organizationId, agentUserId, name, sourceFileName, checksum, rows } =
    params;

  if (rows.length === 0) {
    throw new Error("계정과목 매핑에서 유효한 행을 찾을 수 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const catalog = await tx.accountCatalog.create({
      data: {
        agentOrganizationId: organizationId,
        uploadedByAgentUserId: agentUserId,
        name,
        sourceFileName,
        checksum,
      },
      select: { id: true },
    });

    const data: Prisma.AccountCatalogEntryCreateManyInput[] = rows.map(
      (row) => ({
        catalogId: catalog.id,
        code: row.code,
        wehagoName: row.wehagoName,
        category: row.category,
        isCompanyDefined: row.isCompanyDefined,
        standardName: row.standardName,
        usage: row.usage,
        isRevenue: row.isRevenue,
        isExpense: row.isExpense,
        hasVat: row.hasVat,
      }),
    );

    const created = await tx.accountCatalogEntry.createMany({ data });

    return { catalogId: catalog.id, entryCount: created.count };
  });
}

// 저장된 계정과목 매핑을 파서용 행 목록으로 로드
export async function loadAccountCatalogRows(
  organizationId: string,
  catalogId: string,
): Promise<AccountCatalogRow[]> {
  const catalog = await prisma.accountCatalog.findFirst({
    where: { id: catalogId, agentOrganizationId: organizationId },
    select: { id: true },
  });
  if (!catalog) {
    throw new Error("선택한 계정과목 매핑을 찾을 수 없습니다.");
  }

  const entries = await prisma.accountCatalogEntry.findMany({
    where: { catalogId },
    select: {
      code: true,
      wehagoName: true,
      category: true,
      isCompanyDefined: true,
      standardName: true,
      usage: true,
      isRevenue: true,
      isExpense: true,
      hasVat: true,
    },
  });

  return entries.map((e) => ({
    code: e.code,
    wehagoName: e.wehagoName,
    category: e.category,
    isCompanyDefined: e.isCompanyDefined,
    standardName: e.standardName,
    usage: e.usage,
    isRevenue: e.isRevenue,
    isExpense: e.isExpense,
    hasVat: e.hasVat,
  }));
}

// 재무 리포트(짝지은 거래 + 요약) 저장 → SAVED 상태
export async function saveFinancialReport(params: {
  organizationId: string;
  agentUserId: string;
  companyId: string;
  accountCatalogId: string | null;
  fileName: string;
  checksum: string;
  parsed: ParsedFinancialReport;
}): Promise<{ reportId: string; entryCount: number; publishStatus: "SAVED" }> {
  const {
    organizationId,
    agentUserId,
    companyId,
    accountCatalogId,
    fileName,
    checksum,
    parsed,
  } = params;

  return prisma.$transaction(async (tx) => {
    const report = await tx.financialReport.create({
      data: {
        companyId,
        agentOrganizationId: organizationId,
        accountCatalogId,
        uploadedByAgentUserId: agentUserId,
        fiscalYear: parsed.fiscalYear,
        fileName,
        checksum,
        memo: buildReportMemo(agentUserId),
        summary: parsed.summary as unknown as Prisma.InputJsonValue,
        entryCount: parsed.entryCount,
        debitTotal: parsed.debitTotal,
        creditTotal: parsed.creditTotal,
      },
      select: { id: true },
    });

    const data: Prisma.FinancialReportEntryCreateManyInput[] =
      parsed.entries.map((entry) => ({
        reportId: report.id,
        rowIndex: entry.rowIndex,
        gubunja: entry.gubunja,
        yearMonth: entry.yearMonth,
        entryDate: entry.entryDate,
        voucherNo: entry.voucherNo,
        debitCode: entry.debitCode,
        debitAccount: entry.debitAccount,
        debitAmount: entry.debitAmount,
        debitStandardName: entry.debitStandardName,
        debitUsage: entry.debitUsage,
        debitIsRevenue: entry.debitIsRevenue,
        debitIsExpense: entry.debitIsExpense,
        debitPartnerCode: entry.debitPartnerCode,
        debitPartnerName: entry.debitPartnerName,
        creditCode: entry.creditCode,
        creditAccount: entry.creditAccount,
        creditAmount: entry.creditAmount,
        creditStandardName: entry.creditStandardName,
        creditIsRevenue: entry.creditIsRevenue,
        creditPartnerCode: entry.creditPartnerCode,
        creditPartnerName: entry.creditPartnerName,
      }));

    const created = await tx.financialReportEntry.createMany({ data });

    return {
      reportId: report.id,
      entryCount: created.count,
      publishStatus: "SAVED",
    };
  });
}

// 리포트 게시: SAVED → PUBLISHED (거래처당 활성 포인터 갱신)
export async function publishFinancialReport(
  organizationId: string,
  agentUserId: string,
  reportId: string,
): Promise<{ reportId: string; companyId: string; publishStatus: "PUBLISHED" }> {
  const report = await prisma.financialReport.findFirst({
    where: { id: reportId, agentOrganizationId: organizationId },
    select: { id: true, companyId: true, memo: true },
  });

  if (!report) {
    throw new Error("발행할 리포트를 찾을 수 없습니다.");
  }

  const uploadedBy = parseUploadedByAgentUserId(report.memo);
  if (uploadedBy && uploadedBy !== agentUserId) {
    throw new Error("해당 리포트를 저장한 에이전트만 발행할 수 있습니다.");
  }

  await prisma.companyActiveFinancialReport.upsert({
    where: { companyId: report.companyId },
    update: { reportId: report.id },
    create: { companyId: report.companyId, reportId: report.id },
  });

  return {
    reportId: report.id,
    companyId: report.companyId,
    publishStatus: "PUBLISHED",
  };
}
