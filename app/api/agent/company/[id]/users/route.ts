import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { buildCompanyUserScope } from "@/app/lib/company-access";

function toId(value: string) {
  return value.toString();
}

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { organizationId: user.agentOrganizationId } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    let companyId: string;
    try {
      companyId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        organizationLink: {
          is: {
            agentOrganizationId: auth.organizationId,
          },
        },
      },
      select: {
        id: true,
        businessNumber: true,
        businessName: true,
        businessType: true,
        representativeName: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const users = await prisma.companyUser.findMany({
      where: buildCompanyUserScope(companyId),
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
    });

    return NextResponse.json({
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
    console.error("Agent company users GET error:", error);
    return NextResponse.json(
      { error: "거래처 사용자 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
