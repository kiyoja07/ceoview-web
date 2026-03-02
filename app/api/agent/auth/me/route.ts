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
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
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
    const phone = typeof phoneRaw === "string" && phoneRaw.length > 0
      ? phoneRaw.slice(0, 30)
      : null;

    if (!name) {
      return NextResponse.json(
        { error: "이름은 비워둘 수 없습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.agentUser.update({
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
    console.error("Agent me PATCH error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
