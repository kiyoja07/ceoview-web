import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAgentOrganizationId } from "../_lib/agent-access";
import { parseAccountCatalog } from "../upload/catalog-parser";
import { computeChecksum, saveAccountCatalog } from "../upload/save-services";

// GET: 조직에 저장된 계정과목 매핑 목록 (재사용 드롭다운용)
export async function GET(request: NextRequest) {
  const auth = await requireAgentOrganizationId(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const catalogs = await prisma.accountCatalog.findMany({
    where: { agentOrganizationId: auth.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      sourceFileName: true,
      createdAt: true,
      _count: { select: { entries: true } },
    },
  });

  return NextResponse.json({
    catalogs: catalogs.map((c) => ({
      id: c.id,
      name: c.name,
      sourceFileName: c.sourceFileName,
      entryCount: c._count.entries,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

// POST: 계정과목 매핑 파일(CSV/엑셀) 업로드 → 파싱 → 저장 (조직 단위 재사용)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const nameRaw = formData.get("name");

    if (!file) {
      return NextResponse.json(
        { error: "계정과목 매핑 파일을 첨부해주세요." },
        { status: 400 },
      );
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      return NextResponse.json(
        { error: "CSV 또는 엑셀(.xlsx, .xls) 파일만 업로드 가능합니다." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const rows = parseAccountCatalog(bytes, fileName);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "계정과목 매핑에서 유효한 행을 찾을 수 없습니다. '코드' 컬럼이 있는지 확인해주세요.",
        },
        { status: 400 },
      );
    }

    const name =
      typeof nameRaw === "string" && nameRaw.trim()
        ? nameRaw.trim()
        : fileName.replace(/\.[^.]+$/, "");

    const saved = await saveAccountCatalog({
      organizationId: auth.organizationId,
      agentUserId: auth.userId,
      name,
      sourceFileName: fileName,
      checksum: computeChecksum(bytes),
      rows,
    });

    return NextResponse.json({
      success: true,
      catalogId: saved.catalogId,
      name,
      entryCount: saved.entryCount,
    });
  } catch (error) {
    console.error("Account catalog upload error:", error);
    const message =
      error instanceof Error ? error.message : "매핑 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
