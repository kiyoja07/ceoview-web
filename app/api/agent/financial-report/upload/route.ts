import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  ensureCompanyAccess,
  requireAgentOrganizationId,
} from "../_lib/agent-access";
import { parseFinancialReport } from "./parse";
import {
  computeChecksum,
  loadAccountCatalogRows,
  saveFinancialReport,
} from "./save-services";

const PREVIEW_ROW_LIMIT = 100;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;
    const accountCatalogId = formData.get("accountCatalogId") as string | null;
    const save = formData.get("save") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "분개장 엑셀 파일을 첨부해주세요." },
        { status: 400 },
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "사업자를 선택해주세요." },
        { status: 400 },
      );
    }

    if (!accountCatalogId) {
      return NextResponse.json(
        { error: "계정과목 매핑을 선택하거나 업로드해주세요." },
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

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls"].includes(ext)) {
      return NextResponse.json(
        { error: "분개장은 엑셀(.xlsx, .xls) 파일만 업로드 가능합니다." },
        { status: 400 },
      );
    }

    const catalogRows = await loadAccountCatalogRows(
      auth.organizationId,
      accountCatalogId,
    );

    const bytes = await file.arrayBuffer();
    const parsed = parseFinancialReport(bytes, catalogRows);

    const previewEntries = parsed.entries.slice(0, PREVIEW_ROW_LIMIT);

    if (!save) {
      return NextResponse.json({
        success: true,
        saved: false,
        published: false,
        companyVisible: false,
        fileName,
        companyId,
        accountCatalogId,
        fiscalYear: parsed.fiscalYear,
        entryCount: parsed.entryCount,
        debitTotal: parsed.debitTotal,
        creditTotal: parsed.creditTotal,
        summary: parsed.summary,
        entries: previewEntries,
      });
    }

    try {
      const result = await saveFinancialReport({
        organizationId: auth.organizationId,
        agentUserId: auth.userId,
        companyId,
        accountCatalogId,
        fileName,
        checksum: computeChecksum(bytes),
        parsed,
      });

      return NextResponse.json({
        success: true,
        saved: true,
        published: false,
        companyVisible: false,
        publishStatus: result.publishStatus,
        reportId: result.reportId,
        savedCount: result.entryCount,
        fileName,
        companyId,
        accountCatalogId,
        fiscalYear: parsed.fiscalYear,
        entryCount: parsed.entryCount,
        debitTotal: parsed.debitTotal,
        creditTotal: parsed.creditTotal,
        summary: parsed.summary,
        entries: previewEntries,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "이미 동일한 분개장이 저장되어 있습니다." },
          { status: 409 },
        );
      }
      const message = err instanceof Error ? err.message : "DB 저장에 실패했습니다.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    console.error("Financial report upload error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "파일 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
