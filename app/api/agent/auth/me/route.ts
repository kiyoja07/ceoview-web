import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import type { AgentProfileUpdateBody } from "@/types/agent/auth";

async function requireActiveAgentUser(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "인증이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
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
    const auth = await requireActiveAgentUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await prisma.agentUser.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isMaster: true,
        isActive: true,
        loginProvider: true,
        agentOrganizationId: true,
        agentOrganization: {
          select: {
            id: true,
            organizationNumber: true,
            organizationName: true,
            representativeName: true,
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
      hasOrganization: Boolean(user.agentOrganizationId),
      organization: user.agentOrganization
        ? {
            id: user.agentOrganization.id.toString(),
            organizationNumber: user.agentOrganization.organizationNumber,
            organizationName: user.agentOrganization.organizationName,
            representativeName: user.agentOrganization.representativeName,
          }
        : null,
    });
  } catch (error) {
    console.error("Agent me error:", error);
    return NextResponse.json(
      { error: "사용자 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireActiveAgentUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as AgentProfileUpdateBody;
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
      const self = await prisma.agentUser.findUnique({
        where: { id: auth.user.id },
        select: { isMaster: true, agentOrganizationId: true },
      });

      if (!self?.isMaster) {
        return NextResponse.json(
          { error: "권한 변경은 마스터 사용자만 가능합니다." },
          { status: 403 },
        );
      }

      // 마스터 → 일반 변경 시, 다른 마스터가 있는지 확인
      if (!body.isMaster && self.agentOrganizationId) {
        const otherMasterCount = await prisma.agentUser.count({
          where: {
            agentOrganizationId: self.agentOrganizationId,
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

    const updated = await prisma.agentUser.update({
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
    console.error("Agent me PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
