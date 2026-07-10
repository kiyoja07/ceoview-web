import { NextRequest, NextResponse } from "next/server";
import { requireAgentOrganizationId } from "../../_lib/agent-access";
import { publishFinancialReport } from "../save-services";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const reportId =
      body && typeof body.reportId === "string" ? body.reportId.trim() : "";

    if (!reportId) {
      return NextResponse.json(
        { error: "발행할 리포트 ID를 입력해주세요." },
        { status: 400 },
      );
    }

    try {
      const published = await publishFinancialReport(
        auth.organizationId,
        auth.userId,
        reportId,
      );

      return NextResponse.json({
        success: true,
        published: true,
        companyVisible: true,
        publishStatus: published.publishStatus,
        reportId: published.reportId,
        companyId: published.companyId,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "발행 처리에 실패했습니다.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error) {
    console.error("Financial report publish error:", error);
    return NextResponse.json(
      { error: "발행 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
