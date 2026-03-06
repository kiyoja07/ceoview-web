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
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
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

    // 휴대폰 번호 변경 시 인증 확인
    const currentUser = await prisma.companyUser.findUnique({
      where: { id: auth.user.id },
      select: { phone: true },
    });
    const currentPhone = currentUser?.phone ?? null;
    const normalizedNewPhone = phone ? phone.replace(/\D/g, "") : null;
    const normalizedCurrentPhone = currentPhone
      ? currentPhone.replace(/\D/g, "")
      : null;

    const phoneChanged = normalizedNewPhone !== normalizedCurrentPhone;

    if (phoneChanged && normalizedNewPhone) {
      const verificationId = body.phoneVerificationId;
      if (!verificationId) {
        return NextResponse.json(
          { error: "휴대폰 인증이 필요합니다." },
          { status: 400 },
        );
      }

      let verificationIdBigInt: bigint;
      try {
        verificationIdBigInt = BigInt(verificationId);
      } catch {
        return NextResponse.json(
          { error: "잘못된 인증 정보입니다." },
          { status: 400 },
        );
      }

      const verification = await prisma.phoneVerificationCode.findUnique({
        where: { id: verificationIdBigInt },
      });

      if (
        !verification ||
        verification.companyUserId !== auth.user.id ||
        verification.phone !== normalizedNewPhone ||
        !verification.verifiedAt
      ) {
        return NextResponse.json(
          { error: "휴대폰 인증을 완료해주세요." },
          { status: 400 },
        );
      }
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
        where: { id: auth.user.id },
        select: { isMaster: true, companyId: true },
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
            companyId: self.companyId,
            isMaster: true,
            isActive: true,
            id: { not: auth.user.id },
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
      where: { id: auth.user.id },
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
    console.error("Company me PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
