import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import type { CompanyInfoUpdateBody } from "@/types/company/users";

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function serializeCompany(company: {
  id: bigint;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  openingDate: Date | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
}) {
  return {
    id: company.id.toString(),
    businessNumber: company.businessNumber,
    businessType: company.businessType,
    businessName: company.businessName,
    representativeName: company.representativeName,
    openingDate: company.openingDate
      ? company.openingDate.toISOString().slice(0, 10)
      : null,
    zipcode: company.zipcode,
    address: company.address,
    addressDetail: company.addressDetail,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const company = await prisma.company.findUnique({
      where: { id: auth.currentCompanyId },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
        openingDate: true,
        zipcode: true,
        address: true,
        addressDetail: true,
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

    // businessType은 클라이언트 입력을 무시하고, 사업자번호에서 자동 판별
    // (사업자번호는 변경 불가이므로 DB에서 현재 값을 조회하여 판별)

    const businessName = body.businessName?.trim() || null;
    const representativeName = body.representativeName?.trim() || null;
    const zipcode = body.zipcode?.trim() || null;
    const address = body.address?.trim() || null;
    const addressDetail = body.addressDetail?.trim() || null;
    const openingDateRaw = body.openingDate?.trim() || null;

    if (openingDateRaw && Number.isNaN(new Date(openingDateRaw).getTime())) {
      return NextResponse.json(
        { error: "개업일 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.company.update({
      where: { id: auth.currentCompanyId },
      data: {
        businessName,
        representativeName,
        openingDate: openingDateRaw ? new Date(openingDateRaw) : null,
        zipcode,
        address,
        addressDetail,
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
        openingDate: true,
        zipcode: true,
        address: true,
        addressDetail: true,
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
