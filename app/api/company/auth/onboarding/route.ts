import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";
import { upsertPendingCompanyJoinRequest } from "@/app/lib/company-join-requests";
import { deriveBusinessType } from "@/app/lib/business-type";

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
  // 사업자구분은 사업자번호에서 자동 판별
  const businessType =
    businessNumber.length >= 5 ? deriveBusinessType(businessNumber) : undefined;
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
    const access = await resolveCompanyAccessContext(request);
    if (!access) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CompanyOnboardingBody;
    const parsed = parseBody(body);

    if (!parsed.name || !parsed.businessNumber) {
      return NextResponse.json(
        { error: "이름, 사업자번호는 필수입니다." },
        { status: 400 },
      );
    }

    if (parsed.businessNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 숫자 10자리여야 합니다." },
        { status: 400 },
      );
    }

    // businessType은 parseBody에서 사업자번호 기반으로 자동 결정됨
    if (!parsed.businessType) {
      return NextResponse.json(
        { error: "사업자번호에서 사업자구분을 판별할 수 없습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.companyUser.findUnique({
        where: { id: access.userId },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!current || !current.isActive) {
        return null;
      }

      const existingCompany = await tx.company.findUnique({
        where: { businessNumber: parsed.businessNumber },
        select: {
          id: true,
          businessNumber: true,
          businessName: true,
        },
      });

      if (
        existingCompany &&
        existingCompany.id.toString() !== access.currentCompanyId
      ) {
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
          },
        });

        const request = await upsertPendingCompanyJoinRequest(tx, {
          companyId: existingCompany.id,
          companyUserId: current.id,
          businessNumber: parsed.businessNumber,
        });

        return {
          resultType: "pending_join_request",
          request,
          user,
        } as const;
      }

      await tx.company.update({
        where: { id: access.currentCompanyId },
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
        },
      });

      const company = await tx.company.findUnique({
        where: { id: access.currentCompanyId },
        select: {
          id: true,
          businessNumber: true,
          businessType: true,
          businessName: true,
          representativeName: true,
          address: true,
        },
      });

      return company ? { resultType: "completed", user, company } : null;
    });

    if (!updated) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    if (updated.resultType === "pending_join_request") {
      const request = updated.request;
      if (!request) {
        throw new Error("가입 요청 정보를 처리할 수 없습니다.");
      }

      return NextResponse.json({
        status: "pending_join_request",
        requestId: request.id.toString(),
        redirectTo: "/company/auth/pending",
        company: {
          id: request.company.id.toString(),
          businessNumber: request.company.businessNumber,
          businessName: request.company.businessName,
        },
      });
    }

    const company = updated.company;
    if (!company) {
      throw new Error("사업장 정보를 처리할 수 없습니다.");
    }

    return NextResponse.json({
      id: updated.user.id.toString(),
      email: updated.user.email,
      name: updated.user.name,
      phone: updated.user.phone,
      profileComplete: isCompanyProfileComplete(company.address),
      company: {
        id: company.id.toString(),
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessName: company.businessName,
        representativeName: company.representativeName,
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
