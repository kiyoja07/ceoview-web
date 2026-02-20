import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import type { BusinessEntityModel } from "@/app/generated/prisma/models/BusinessEntity";

// GET: 전체 목록 조회
export async function GET() {
  try {
    const entities = await prisma.businessEntity.findMany({
      orderBy: { createdAt: "desc" },
    });

    // BigInt → string 변환 (JSON 직렬화)
    const data = entities.map((e: BusinessEntityModel) => ({
      ...e,
      id: e.id.toString(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("BusinessEntity GET error:", error);
    return NextResponse.json(
      { error: "목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST: 새 사업자 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessNumber,
      businessType,
      businessName,
      representativeName,
      openingDate,
    } = body;

    // 유효성 검사
    if (!businessNumber || !businessType) {
      return NextResponse.json(
        { error: "사업자번호와 사업자구분은 필수입니다." },
        { status: 400 },
      );
    }

    // 사업자번호 숫자만 추출 (하이픈 제거)
    const cleanNumber = businessNumber.replace(/\D/g, "");
    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 10자리여야 합니다." },
        { status: 400 },
      );
    }

    if (!["INDIVIDUAL", "CORPORATION"].includes(businessType)) {
      return NextResponse.json(
        { error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다." },
        { status: 400 },
      );
    }

    const entity = await prisma.businessEntity.create({
      data: {
        businessNumber: cleanNumber,
        businessType,
        businessName: businessName || null,
        representativeName: representativeName || null,
        openingDate: openingDate ? new Date(openingDate) : null,
      },
    });

    return NextResponse.json(
      {
        ...entity,
        id: entity.id.toString(),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("BusinessEntity POST error:", error);

    // 중복 사업자번호 처리
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "이미 등록된 사업자번호입니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
