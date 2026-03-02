import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import type { CompanyInfoUpdateBody } from "@/types/company/users";

async function requireCompanyMember(request: NextRequest) {
  const userId = getCompanyUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.companyUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      isMaster: true,
      companyId: true,
    },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    isMaster: user.isMaster,
  } as const;
}

function serializeCompany(company: {
  id: bigint;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  openingDate: Date | null;
  address: string | null;
}) {
  return {
    id: company.id.toString(),
    businessNumber: company.businessNumber,
    businessType: company.businessType,
    businessName: company.businessName,
    representativeName: company.representativeName,
    openingDate: company.openingDate ? company.openingDate.toISOString().slice(0, 10) : null,
    address: company.address,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
        openingDate: true,
        address: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "회사 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      canManageCompanyInfo: auth.isMaster,
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company info GET error:", error);
    return NextResponse.json(
      { error: "회사 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: "회사 정보 변경은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CompanyInfoUpdateBody;

    const businessType = body.businessType;
    if (
      businessType !== undefined &&
      businessType !== "INDIVIDUAL" &&
      businessType !== "CORPORATION"
    ) {
      return NextResponse.json(
        { error: "사업자구분이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const businessName = body.businessName?.trim() || null;
    const representativeName = body.representativeName?.trim() || null;
    const address = body.address?.trim() || null;
    const openingDateRaw = body.openingDate?.trim() || null;

    if (openingDateRaw && Number.isNaN(new Date(openingDateRaw).getTime())) {
      return NextResponse.json(
        { error: "개업일 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.company.update({
      where: { id: auth.companyId },
      data: {
        businessType,
        businessName,
        representativeName,
        openingDate: openingDateRaw ? new Date(openingDateRaw) : null,
        address,
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
        openingDate: true,
        address: true,
      },
    });

    return NextResponse.json({
      canManageCompanyInfo: true,
      company: serializeCompany(updated),
    });
  } catch (error) {
    console.error("Company info PATCH error:", error);
    return NextResponse.json(
      { error: "회사 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
