import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getAgentUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.agentUser.findUnique({
      where: { id: userId },
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

    if (!user || !user.isActive) {
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
