import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyCompanyUserInviteToken } from "@/app/lib/company-user-invite";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "초대 토큰이 필요합니다." },
        { status: 400 },
      );
    }

    const payload = verifyCompanyUserInviteToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "초대 링크가 만료되었거나 유효하지 않습니다." },
        { status: 410 },
      );
    }

    let companyId: bigint;
    try {
      companyId = BigInt(payload.companyId);
    } catch {
      return NextResponse.json(
        { error: "유효하지 않은 초대 정보입니다." },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        businessNumber: true,
        businessName: true,
        businessType: true,
        representativeName: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "초대된 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      company: {
        id: company.id.toString(),
        businessNumber: company.businessNumber,
        businessName: company.businessName,
        businessType: company.businessType,
        representativeName: company.representativeName,
      },
      contactType: payload.contactType,
      contact: payload.contact,
      role: payload.role,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Company invite verify error:", error);
    return NextResponse.json(
      { error: "초대 정보 확인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
