import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  buildCompanyUserScope,
  resolveCompanyAccessContext,
} from "@/app/lib/company-access";
import type { CompanyUsersUpdateBody } from "@/types/company/users";

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function toId(value: bigint) {
  return value.toString();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [company, users] = await Promise.all([
      prisma.company.findUnique({
        where: { id: auth.currentCompanyId },
        select: {
          id: true,
          businessNumber: true,
          businessType: true,
          businessName: true,
          representativeName: true,
        },
      }),
      prisma.companyUser.findMany({
        where: buildCompanyUserScope(auth.currentCompanyId),
        orderBy: [{ isMaster: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isMaster: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: "회사 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      currentUserId: toId(auth.userId),
      canManageUsers: auth.isMaster,
      company: {
        ...company,
        id: toId(company.id),
      },
      summary: {
        total: users.length,
        active: users.filter((user) => user.isActive).length,
        masters: users.filter((user) => user.isMaster).length,
      },
      users: users.map((user) => ({
        ...user,
        id: toId(user.id),
      })),
    });
  } catch (error) {
    console.error("Company users GET error:", error);
    return NextResponse.json(
      { error: "사용자 목록 조회에 실패했습니다." },
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
        { error: "사용자 상태 변경은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CompanyUsersUpdateBody;
    if (typeof body.userId !== "string") {
      return NextResponse.json(
        { error: "유효한 사용자 ID를 입력해주세요." },
        { status: 400 },
      );
    }

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "유효한 상태값을 입력해주세요." },
        { status: 400 },
      );
    }

    let targetUserId: bigint;
    try {
      targetUserId = BigInt(body.userId);
    } catch {
      return NextResponse.json(
        { error: "유효한 사용자 ID를 입력해주세요." },
        { status: 400 },
      );
    }

    const target = await prisma.companyUser.findFirst({
      where: {
        id: targetUserId,
        ...buildCompanyUserScope(auth.currentCompanyId),
      },
      select: {
        id: true,
        isMaster: true,
        isActive: true,
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: "대상 사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (target.id === auth.userId && !body.isActive) {
      return NextResponse.json(
        { error: "본인 계정은 비활성화할 수 없습니다." },
        { status: 400 },
      );
    }

    if (target.isMaster && target.isActive && !body.isActive) {
      const activeMasterCount = await prisma.companyUser.count({
        where: {
          isMaster: true,
          isActive: true,
          ...buildCompanyUserScope(auth.currentCompanyId),
        },
      });

      if (activeMasterCount <= 1) {
        return NextResponse.json(
          { error: "마지막 마스터 사용자는 비활성화할 수 없습니다." },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.companyUser.update({
      where: { id: target.id },
      data: {
        isActive: body.isActive,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      userId: toId(updated.id),
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Company users PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 상태 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
