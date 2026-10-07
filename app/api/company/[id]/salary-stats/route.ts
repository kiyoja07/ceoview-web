import { NextRequest, NextResponse } from "next/server";
import { authorizeCompanySalaryAccess } from "@/app/lib/company-salary-access";
import { computeSalaryStats } from "@/app/lib/salary-stats";

/**
 * GET /api/company/[id]/salary-stats?months=12
 *
 * 최근 N개월 (기본 12개월) 동안의 월별 소득유형별 지급액(근로/사업/일용/기타)
 * 및 총지급액 / 총공제액 / 차인지급액 통계를 반환합니다.
 * 근로·사업·기타소득은 paymentYm 기준, 일용직은 Upload.uploadedAt 기준으로 집계합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;

    const access = await authorizeCompanySalaryAccess(request, companyId);
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const months = Math.min(
      Math.max(parseInt(searchParams.get("months") ?? "12", 10) || 12, 1),
      60,
    );

    const result = await computeSalaryStats(request, companyId, months);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("급여 통계 조회 실패:", error);
    return NextResponse.json(
      { error: "급여 통계를 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}
