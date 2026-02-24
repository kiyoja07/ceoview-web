import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.companyUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isMaster: true,
        isActive: true,
        loginProvider: true,
        companyId: true,
        company: {
          select: {
            id: true,
            businessNumber: true,
            businessType: true,
            businessName: true,
            representativeName: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      isMaster: user.isMaster,
      loginProvider: user.loginProvider,
      hasCompany: Boolean(user.companyId),
      company: user.company
        ? {
            id: user.company.id.toString(),
            businessNumber: user.company.businessNumber,
            businessType: user.company.businessType,
            businessName: user.company.businessName,
            representativeName: user.company.representativeName,
          }
        : null,
    });
  } catch (error) {
    console.error("Company me error:", error);
    return NextResponse.json(
      { error: "사용자 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}
