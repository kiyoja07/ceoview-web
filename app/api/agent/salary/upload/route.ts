import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  INCOME_TYPE_LABELS,
  REQUIRED_COLUMNS,
  isSalaryIncomeType,
} from "./constants";
import { parseWorksheetByIncomeType } from "./parsers";
import { saveRowsByIncomeType } from "./persistence";

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { userId, organizationId: user.agentOrganizationId } as const;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const incomeTypeRaw = formData.get("incomeType");
    const companyId = formData.get("companyId") as string | null;
    const accrualYm = formData.get("accrualYm") as string | null;
    const paymentYm = formData.get("paymentYm") as string | null;
    const payDateStr = formData.get("payDate") as string | null;
    const save = formData.get("save") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "엑셀 파일을 첨부해주세요." },
        { status: 400 },
      );
    }

    if (typeof incomeTypeRaw !== "string" || !isSalaryIncomeType(incomeTypeRaw)) {
      return NextResponse.json(
        { error: "올바른 소득유형을 선택해주세요." },
        { status: 400 },
      );
    }

    const incomeType = incomeTypeRaw;

    if (!companyId) {
      return NextResponse.json(
        { error: "사업자를 선택해주세요." },
        { status: 400 },
      );
    }

    let parsedCompanyId: bigint;
    try {
      parsedCompanyId = BigInt(companyId);
    } catch {
      return NextResponse.json(
        { error: "유효한 사업자 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId: parsedCompanyId,
        },
      },
      select: { companyId: true },
    });

    if (!companyLink) {
      return NextResponse.json(
        { error: "접근 권한이 없는 사업자입니다." },
        { status: 403 },
      );
    }

    if (incomeType !== "OTHER_INCOME_LABOR" && !accrualYm) {
      return NextResponse.json(
        { error: "귀속년월을 선택해주세요." },
        { status: 400 },
      );
    }

    if (incomeType === "EARNED_INCOME" && !payDateStr) {
      return NextResponse.json(
        { error: "근로소득은 지급일을 선택해주세요." },
        { status: 400 },
      );
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      return NextResponse.json(
        { error: "엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: "엑셀 파일에 시트가 없습니다." },
        { status: 400 },
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const { columns, rows } = parseWorksheetByIncomeType(worksheet, incomeType);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "엑셀 파일에 데이터가 없습니다." },
        { status: 400 },
      );
    }

    const requiredCols = REQUIRED_COLUMNS[incomeType];
    const missingCols = requiredCols.filter((col) => !columns.includes(col));

    if (missingCols.length > 0) {
      return NextResponse.json(
        {
          error: `${INCOME_TYPE_LABELS[incomeType]} 엑셀에 필수 컬럼이 누락되었습니다: ${missingCols.join(", ")}\n(감지된 컬럼: ${columns.join(", ")})`,
          expectedColumns: requiredCols,
          actualColumns: columns,
        },
        { status: 400 },
      );
    }

    if (save) {
      try {
        const result = await saveRowsByIncomeType({
          incomeType,
          organizationId: auth.organizationId,
          agentUserId: auth.userId,
          companyId,
          fileName,
          rows,
          accrualYm,
          paymentYm,
          payDateStr,
        });

        return NextResponse.json({
          success: true,
          saved: true,
          published: false,
          companyVisible: false,
          publishStatus: result.publishStatus,
          savedCount: result.savedCount,
          uploadId: result.uploadId,
          fileName,
          sheetName,
          incomeType,
          incomeTypeLabel: INCOME_TYPE_LABELS[incomeType],
          companyId,
          accrualYm,
          totalRows: rows.length,
          columns,
          rows: rows.slice(0, 100),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "DB 저장에 실패했습니다.";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      saved: false,
      published: false,
      companyVisible: false,
      fileName,
      sheetName,
      incomeType,
      incomeTypeLabel: INCOME_TYPE_LABELS[incomeType],
      companyId,
      accrualYm,
      totalRows: rows.length,
      columns,
      rows,
    });
  } catch (error) {
    console.error("Salary upload error:", error);
    return NextResponse.json(
      { error: "파일 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
