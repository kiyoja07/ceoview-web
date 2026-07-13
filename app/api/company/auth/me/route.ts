import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  buildCompanyUserScope,
  resolveCompanyAccessContext,
} from "@/app/lib/company-access";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";
import {
  assertVerifiedPhoneChange,
  normalizePhoneVerificationPhone,
  PhoneVerificationError,
} from "@/app/lib/phone-verification";
import type { CompanyProfileUpdateBody } from "@/types/company/auth";

async function requireActiveCompanyUser(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "인증이 필요합니다.", status: 401 } as const;
  }

  return { context } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireActiveCompanyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await prisma.companyUser.findUnique({
      where: { id: auth.context.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isMaster: true,
        isActive: true,
        loginProvider: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const pendingJoinRequest = await prisma.companyJoinRequest.findFirst({
      where: {
        companyUserId: user.id,
        status: "PENDING",
      },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        company: {
          select: {
            id: true,
            businessNumber: true,
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      isMaster: user.isMaster,
      loginProvider: user.loginProvider,
      hasCompany: auth.context.companies.length > 0,
      profileComplete: isCompanyProfileComplete(auth.context.company.address),
      pendingJoinRequest: pendingJoinRequest
        ? {
            id: pendingJoinRequest.id.toString(),
            status: pendingJoinRequest.status,
            requestedAt: pendingJoinRequest.requestedAt.toISOString(),
            company: {
              id: pendingJoinRequest.company.id.toString(),
              businessNumber: pendingJoinRequest.company.businessNumber,
              businessName: pendingJoinRequest.company.businessName,
            },
          }
        : null,
      currentCompanyId: auth.context.currentCompanyId.toString(),
      features: auth.context.company.features,
      company: auth.context.company
        ? {
            id: auth.context.company.id.toString(),
            businessNumber: auth.context.company.businessNumber,
            businessType: auth.context.company.businessType,
            businessName: auth.context.company.businessName,
            representativeName: auth.context.company.representativeName,
          }
        : null,
      companies: auth.context.companies.map((company) => ({
        id: company.id.toString(),
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessName: company.businessName,
        representativeName: company.representativeName,
      })),
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

    // 휴대폰 번호 변경 시 인증 확인
    const currentUser = await prisma.companyUser.findUnique({
      where: { id: auth.context.userId },
      select: { phone: true },
    });
    const currentPhone = currentUser?.phone ?? null;
    const normalizedNewPhone = phone
      ? normalizePhoneVerificationPhone(phone)
      : null;
    const normalizedCurrentPhone = currentPhone
      ? normalizePhoneVerificationPhone(currentPhone)
      : null;

    const phoneChanged = normalizedNewPhone !== normalizedCurrentPhone;

    if (phoneChanged && normalizedNewPhone) {
      await assertVerifiedPhoneChange(
        { kind: "company", userId: auth.context.userId },
        normalizedNewPhone,
        body.phoneVerificationId,
      );
    }

    // isMaster 변경 처리 (마스터 사용자만 가능)
    const updateData: {
      name: string;
      phone: string | null;
      isMaster?: boolean;
    } = {
      name: name.slice(0, 100),
      phone,
    };

    if (typeof body.isMaster === "boolean") {
      // 현재 사용자가 마스터인지 확인
      const self = await prisma.companyUser.findUnique({
        where: { id: auth.context.userId },
        select: { isMaster: true },
      });

      if (!self?.isMaster) {
        return NextResponse.json(
          { error: "권한 변경은 마스터 사용자만 가능합니다." },
          { status: 403 },
        );
      }

      // 마스터 → 일반으로 변경 시, 다른 마스터가 있는지 확인
      if (!body.isMaster) {
        const otherMasterCount = await prisma.companyUser.count({
          where: {
            isMaster: true,
            isActive: true,
            id: { not: auth.context.userId },
            ...buildCompanyUserScope(auth.context.currentCompanyId),
          },
        });

        if (otherMasterCount === 0) {
          return NextResponse.json(
            { error: "최소 1명의 마스터 사용자가 필요합니다." },
            { status: 400 },
          );
        }
      }

      updateData.isMaster = body.isMaster;
    }

    const updated = await prisma.companyUser.update({
      where: { id: auth.context.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isMaster: true,
      },
    });

    return NextResponse.json({
      id: updated.id.toString(),
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      isMaster: updated.isMaster,
    });
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Company me PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
