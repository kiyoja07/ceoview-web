import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { serializeCompanyChangeRequest } from "@/app/lib/company-change-request";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

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

  return { userId, organizationId: user.agentOrganizationId } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const scope = searchParams.get("scope")?.trim();
    const action = searchParams.get("action")?.trim();
    const companyId = searchParams.get("companyId")?.trim();

    let parsedCompanyId: bigint | undefined;
    if (companyId) {
      try {
        parsedCompanyId = BigInt(companyId);
      } catch {
        return NextResponse.json(
          { error: "유효한 거래처 ID가 아닙니다." },
          { status: 400 },
        );
      }
    }

    const baseWhere = {
      company: {
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      ...(scope ? { scope: scope as "EMPLOYEE" | "COMPANY_INFO" } : {}),
      ...(action ? { action: action as "CREATE" | "UPDATE" | "DELETE" } : {}),
      ...(parsedCompanyId ? { companyId: parsedCompanyId } : {}),
    };

    const filteredWhere = {
      ...baseWhere,
      ...(status
        ? {
            status: status as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "CANCELLED",
          }
        : {}),
    };

    const [items, total, pending, approved, rejected, cancelled] =
      await Promise.all([
      prisma.companyChangeRequest.findMany({
        where: filteredWhere,
        include: {
          company: {
            select: {
              id: true,
              businessNumber: true,
              businessName: true,
            },
          },
          requestedByCompanyUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolvedByAgentUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      prisma.companyChangeRequest.count({
        where: baseWhere,
      }),
      prisma.companyChangeRequest.count({
        where: { ...baseWhere, status: "PENDING" },
      }),
      prisma.companyChangeRequest.count({
        where: { ...baseWhere, status: "APPROVED" },
      }),
      prisma.companyChangeRequest.count({
        where: { ...baseWhere, status: "REJECTED" },
      }),
      prisma.companyChangeRequest.count({
        where: { ...baseWhere, status: "CANCELLED" },
      }),
    ]);

    return NextResponse.json({
      items: items.map((item) => serializeCompanyChangeRequest(item)),
      total: items.length,
      summary: {
        total,
        pending,
        approved,
        rejected,
        cancelled,
      },
    });
  } catch (error) {
    console.error("Agent company requests GET error:", error);
    return NextResponse.json(
      { error: "요청함을 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}
