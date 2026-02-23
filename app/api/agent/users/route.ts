import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import type { UpdateBody } from "@/types/agent/users";

async function requireAgentMaster(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      isMaster: true,
      agentOrganizationId: true,
    },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직이 없습니다.",
      status: 403,
    } as const;
  }

  if (!user.isMaster) {
    const existingMasterCount = await prisma.agentUser.count({
      where: {
        agentOrganizationId: user.agentOrganizationId,
        isMaster: true,
      },
    });

    if (existingMasterCount === 0) {
      await prisma.agentUser.update({
        where: { id: user.id },
        data: { isMaster: true },
      });
      return {
        currentUserId: user.id,
        organizationId: user.agentOrganizationId,
      } as const;
    }

    return { error: "마스터 사용자만 접근할 수 있습니다.", status: 403 } as const;
  }

  return {
    currentUserId: user.id,
    organizationId: user.agentOrganizationId,
  } as const;
}

function toUserIdString(value: bigint) {
  return value.toString();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentMaster(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [agentUsers, companyUsers] = await Promise.all([
      prisma.agentUser.findMany({
        where: { agentOrganizationId: auth.organizationId },
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
      prisma.companyUser.findMany({
        where: {
          agentLinks: {
            some: {
              agentUser: { agentOrganizationId: auth.organizationId },
            },
          },
        },
        orderBy: [{ companyId: "asc" }, { isMaster: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          companyId: true,
          email: true,
          name: true,
          phone: true,
          isMaster: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              businessNumber: true,
              businessName: true,
              representativeName: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      currentUserId: toUserIdString(auth.currentUserId),
      summary: {
        agentUsers: {
          total: agentUsers.length,
          active: agentUsers.filter((item) => item.isActive).length,
          masters: agentUsers.filter((item) => item.isMaster).length,
        },
        companyUsers: {
          total: companyUsers.length,
          active: companyUsers.filter((item) => item.isActive).length,
          masters: companyUsers.filter((item) => item.isMaster).length,
        },
      },
      agentUsers: agentUsers.map((user) => ({
        ...user,
        id: toUserIdString(user.id),
      })),
      companyUsers: companyUsers.map((user) => ({
        ...user,
        id: toUserIdString(user.id),
        companyId: toUserIdString(user.companyId),
      })),
    });
  } catch (error) {
    console.error("Agent users GET error:", error);
    return NextResponse.json(
      { error: "사용자 현황을 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAgentMaster(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as UpdateBody;
    const userType = body.userType;
    const isActive = body.isActive;

    if (!userType || !["AGENT", "COMPANY"].includes(userType)) {
      return NextResponse.json(
        { error: "유효한 사용자 타입을 입력해주세요." },
        { status: 400 },
      );
    }

    if (typeof body.userId !== "string") {
      return NextResponse.json(
        { error: "유효한 사용자 ID를 입력해주세요." },
        { status: 400 },
      );
    }

    if (typeof isActive !== "boolean") {
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

    if (userType === "AGENT") {
      const target = await prisma.agentUser.findFirst({
        where: {
          id: targetUserId,
          agentOrganizationId: auth.organizationId,
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

      if (target.id === auth.currentUserId && !isActive) {
        return NextResponse.json(
          { error: "본인 계정은 탈퇴 처리할 수 없습니다." },
          { status: 400 },
        );
      }

      if (target.isMaster && target.isActive && !isActive) {
        const activeMasterCount = await prisma.agentUser.count({
          where: {
            agentOrganizationId: auth.organizationId,
            isMaster: true,
            isActive: true,
          },
        });

        if (activeMasterCount <= 1) {
          return NextResponse.json(
            { error: "마지막 마스터 사용자는 탈퇴 처리할 수 없습니다." },
            { status: 400 },
          );
        }
      }

      const updated = await prisma.agentUser.update({
        where: { id: target.id },
        data: { isActive },
        select: {
          id: true,
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        userType,
        userId: toUserIdString(updated.id),
        isActive: updated.isActive,
      });
    }

    const target = await prisma.companyUser.findFirst({
      where: {
        id: targetUserId,
        agentLinks: {
          some: {
            agentUser: { agentOrganizationId: auth.organizationId },
          },
        },
      },
      select: {
        id: true,
        companyId: true,
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

    if (target.isMaster && target.isActive && !isActive) {
      const activeMasterCount = await prisma.companyUser.count({
        where: {
          companyId: target.companyId,
          isMaster: true,
          isActive: true,
        },
      });

      if (activeMasterCount <= 1) {
        return NextResponse.json(
          { error: "해당 회사의 마지막 마스터 사용자는 탈퇴 처리할 수 없습니다." },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.companyUser.update({
      where: { id: target.id },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      userType,
      userId: toUserIdString(updated.id),
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Agent users PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 상태 변경 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
