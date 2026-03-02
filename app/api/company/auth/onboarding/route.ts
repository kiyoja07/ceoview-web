import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";

type CompanyOnboardingBody = {
  name?: string;
  phone?: string | null;
  businessNumber?: string;
  businessType?: "INDIVIDUAL" | "CORPORATION";
  businessName?: string | null;
  representativeName?: string | null;
  openingDate?: string | null;
  address?: string | null;
};

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function parseBody(body: CompanyOnboardingBody) {
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() || null;
  const businessNumber = (body.businessNumber?.trim() ?? "").replace(/\D/g, "");
  const businessType = body.businessType;
  const businessName = body.businessName?.trim() || null;
  const representativeName = body.representativeName?.trim() || null;
  const openingDate = body.openingDate?.trim() || null;
  const address = body.address?.trim() || null;

  return {
    name,
    phone,
    businessNumber,
    businessType,
    businessName,
    representativeName,
    openingDate,
    address,
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as CompanyOnboardingBody;
    const parsed = parseBody(body);

    if (!parsed.name || !parsed.businessNumber || !parsed.businessType) {
      return NextResponse.json(
        { error: "이름, 사업자번호, 사업자구분은 필수입니다." },
        { status: 400 },
      );
    }

    if (parsed.businessNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 숫자 10자리여야 합니다." },
        { status: 400 },
      );
    }

    if (!["INDIVIDUAL", "CORPORATION"].includes(parsed.businessType)) {
      return NextResponse.json(
        { error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.companyUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
          companyId: true,
          company: {
            select: {
              address: true,
            },
          },
        },
      });

      if (!current || !current.isActive) {
        return null;
      }

      await tx.company.update({
        where: { id: current.companyId },
        data: {
          businessNumber: parsed.businessNumber,
          businessType: parsed.businessType,
          businessName: parsed.businessName,
          representativeName: parsed.representativeName,
          openingDate: parsed.openingDate ? new Date(parsed.openingDate) : null,
          address: parsed.address,
        },
      });

      const user = await tx.companyUser.update({
        where: { id: current.id },
        data: {
          name: parsed.name,
          phone: parsed.phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          company: {
            select: {
              id: true,
              businessNumber: true,
              businessType: true,
              businessName: true,
              representativeName: true,
              address: true,
            },
          },
        },
      });

      return user;
    });

    if (!updated) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    return NextResponse.json({
      id: updated.id.toString(),
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      profileComplete: isCompanyProfileComplete(updated.company.address),
      company: {
        id: updated.company.id.toString(),
        businessNumber: updated.company.businessNumber,
        businessType: updated.company.businessType,
        businessName: updated.company.businessName,
        representativeName: updated.company.representativeName,
      },
      redirectTo: "/company/dashboard",
    });
  } catch (error: unknown) {
    console.error("Company onboarding error:", error);

    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "이미 등록된 사업자번호입니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "온보딩 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
