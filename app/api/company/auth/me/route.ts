import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";
import type { CompanyProfileUpdateBody } from "@/types/company/auth";

async function requireActiveCompanyUser(request: NextRequest) {
  const userId = getCompanyUserIdFromRequest(request);
  if (!userId) {
    return { error: "인증이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.companyUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return { error: "인증이 필요합니다.", status: 401 } as const;
  }

  return { user } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireActiveCompanyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await prisma.companyUser.findUnique({
      where: { id: auth.user.id },
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
            address: true,
          },
        },
      },
    });

    if (!user) {
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
      profileComplete: isCompanyProfileComplete(user.company?.address ?? null),
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

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireActiveCompanyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as CompanyProfileUpdateBody & {
      email?: string;
    };
    if (typeof body.email === "string") {
      return NextResponse.json(
        { error: "이메일은 변경할 수 없습니다." },
        { status: 400 },
      );
    }
    const name = body.name?.trim() ?? "";
    const phoneRaw = body.phone?.trim();
    const phone =
      typeof phoneRaw === "string" && phoneRaw.length > 0
        ? phoneRaw.slice(0, 30)
        : null;

    if (!name) {
      return NextResponse.json(
        { error: "이름은 비워둘 수 없습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.companyUser.update({
      where: { id: auth.user.id },
      data: {
        name: name.slice(0, 100),
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });

    return NextResponse.json({
      id: updated.id.toString(),
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
    });
  } catch (error) {
    console.error("Company me PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
