import { NextRequest, NextResponse } from "next/server";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";

const bizNumberApiKey = process.env.BIZ_NUMBER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
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

    const cleanNumber = (businessNumber as string).replace(/\D/g, "");
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
      return NextResponse.json(data.data[0]);
    }

    return NextResponse.json(
      { error: "조회 결과를 확인할 수 없습니다." },
      { status: 502 },
    );
  } catch (error) {
    console.error("Company business number validation error:", error);
    return NextResponse.json(
      { error: "사업자번호 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
