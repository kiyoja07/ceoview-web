import { NextRequest, NextResponse } from "next/server";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

const bizNumberApiKey = process.env.BIZ_NUMBER_API_KEY;

export interface BizStatusResponse {
  b_no: string; // 사업자번호
  b_stt: string; // 납세자상태 (계속사업자, 휴업자, 폐업자)
  b_stt_cd: string; // 납세자상태코드 (01: 계속, 02: 휴업, 03: 폐업)
  tax_type: string; // 과세유형
  tax_type_cd: string; // 과세유형코드
  end_dt: string; // 폐업일 (YYYYMMDD, 없으면 빈문자열)
  utcc_yn: string; // 단위과세전환폐업여부
  tax_type_change_dt: string; // 최근과세유형전환일자
  invoice_apply_dt: string; // 세금계산서적용일자
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const userId = getAgentUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { businessNumber } = body;

    if (!businessNumber) {
      return NextResponse.json(
        { error: "사업자번호를 입력해주세요." },
        { status: 400 },
      );
    }

    const cleanNumber = businessNumber.replace(/\D/g, "");
    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 10자리여야 합니다." },
        { status: 400 },
      );
    }

    if (!bizNumberApiKey) {
      return NextResponse.json(
        { error: "사업자 조회 API 키가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${bizNumberApiKey}&returnType=JSON`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b_no: [cleanNumber] }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "국세청 API 호출에 실패했습니다." },
        { status: 502 },
      );
    }

    const data = await response.json();

    if (data.status_code === "OK" && data.data?.[0]) {
      const result = data.data[0] as BizStatusResponse;
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "조회 결과를 확인할 수 없습니다." },
      { status: 502 },
    );
  } catch (error) {
    console.error("Business number validation error:", error);
    return NextResponse.json(
      { error: "사업자번호 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
