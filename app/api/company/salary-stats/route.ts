import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import { computeSalaryStats } from "@/app/lib/salary-stats";

/**
 * GET /api/company/salary-stats?months=12
 *
 * 로그인한 회사 사용자의 현재 선택된 회사 기준으로 급여 통계를 반환한다.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveCompanyAccessContext(request);
    if (!auth) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const months = Math.min(
      Math.max(parseInt(searchParams.get("months") ?? "12", 10) || 12, 1),
      60,
    );

    const result = await computeSalaryStats(
      request,
      auth.currentCompanyId,
      months,
    );
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
