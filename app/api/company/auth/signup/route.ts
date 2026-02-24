import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/password";
import { attachCompanySession } from "@/app/lib/company-auth";
import type { CompanySignupBody } from "@/types/company/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompanySignupBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;

    const rawBusinessNumber = body.businessNumber?.trim() || "";
    const businessNumber = rawBusinessNumber.replace(/\D/g, "");
    const businessType = body.businessType;
    const businessName = body.businessName?.trim() || null;
    const representativeName = body.representativeName?.trim() || null;
    const openingDate = body.openingDate?.trim() || null;
    const address = body.address?.trim() || null;

    if (!email || !password || !name || !businessNumber || !businessType) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 이름, 사업자번호, 사업자구분은 필수입니다." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    if (businessNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 숫자 10자리여야 합니다." },
        { status: 400 },
      );
    }

    if (!businessType || !["INDIVIDUAL", "CORPORATION"].includes(businessType)) {
      return NextResponse.json(
        { error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const company =
        (await tx.company.findUnique({
          where: { businessNumber },
          select: { id: true },
        })) ||
        (await tx.company.create({
          data: {
            businessNumber,
            businessType,
            businessName,
            representativeName,
            openingDate: openingDate ? new Date(openingDate) : null,
            address,
          },
          select: { id: true },
        }));

      const existingMasterCount = await tx.companyUser.count({
        where: {
          companyId: company.id,
          isMaster: true,
        },
      });

      return tx.companyUser.create({
        data: {
          companyId: company.id,
          email,
          passwordHash,
          loginProvider: "LOCAL",
          name,
          phone,
          isMaster: existingMasterCount === 0,
        },
        select: {
          id: true,
          email: true,
          name: true,
          companyId: true,
        },
      });
    });

    const response = NextResponse.json(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        companyId: user.companyId.toString(),
        redirectTo: "/company/dashboard",
      },
      { status: 201 },
    );

    attachCompanySession(response, user.id);
    return response;
  } catch (error: unknown) {
    console.error("Company signup error:", error);

    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
