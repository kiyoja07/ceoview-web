import { NextRequest, NextResponse } from "next/server";
import { getEmployeeUserIdFromRequest } from "@/app/lib/employee-auth";
import { getEmployeePayslipCollection } from "@/app/lib/employee-payslips";
import { loadEmployeePortalSession } from "@/app/lib/employee-portal";
import type { EmployeePayslipCollection } from "@/types/employee/payslips";

export const dynamic = "force-dynamic";

/**
 * GET /api/employee/payslips
 * 로그인한 직원 본인의 공개(게시)된 급여명세서 목록을 반환한다.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getEmployeeUserIdFromRequest(request);
    const session = userId ? await loadEmployeePortalSession(userId) : null;
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const collection: EmployeePayslipCollection =
      await getEmployeePayslipCollection(session);

    return NextResponse.json(collection, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Employee payslips error:", error);
    return NextResponse.json(
      { error: "급여명세서를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
