import { NextRequest, NextResponse } from "next/server";
import { consumePayslipAccessToken } from "@/app/lib/payslip-view";

/**
 * POST /api/public/payslip/view
 * 급여명세서 1회용 링크 토큰을 소진하고 열람 데이터를 반환한다.
 * 열람 페이지(GET)는 토큰을 소진하지 않고, 사용자가 열람 버튼을 누를 때만 이 API가 호출된다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      token?: unknown;
    } | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "유효하지 않은 링크입니다." },
        { status: 400 },
      );
    }

    const view = await consumePayslipAccessToken(token);
    if (!view) {
      return NextResponse.json(
        {
          error:
            "이미 열람 처리되었거나 만료된 링크입니다. 새 링크를 요청해 주세요.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(view, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Payslip view error:", error);
    return NextResponse.json(
      { error: "급여명세서를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
