import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";

async function requireCompanyUser(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return { user: context } as const;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const pending = await prisma.agentOrganizationCompanyTransferRequest.findUnique(
      {
        where: {
          companyId: auth.user.currentCompanyId,
        },
        select: {
          id: true,
          createdAt: true,
          fromAgentOrganization: {
            select: {
              id: true,
              organizationNumber: true,
              organizationName: true,
            },
          },
          toAgentOrganization: {
            select: {
              id: true,
              organizationNumber: true,
              organizationName: true,
            },
          },
        },
      },
    );

    if (!pending) {
      return NextResponse.json({ hasPendingRequest: false });
    }

    return NextResponse.json({
      hasPendingRequest: true,
      request: {
        id: pending.id.toString(),
        createdAt: pending.createdAt.toISOString(),
        fromOrganization: pending.fromAgentOrganization
          ? {
              id: pending.fromAgentOrganization.id.toString(),
              organizationNumber: pending.fromAgentOrganization.organizationNumber,
              organizationName: pending.fromAgentOrganization.organizationName,
            }
          : null,
        toOrganization: {
          id: pending.toAgentOrganization.id.toString(),
          organizationNumber: pending.toAgentOrganization.organizationNumber,
          organizationName: pending.toAgentOrganization.organizationName,
        },
      },
    });
  } catch (error) {
    console.error("Company transfer request GET error:", error);
    return NextResponse.json(
      { error: "이관 요청 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.user.isMaster) {
      return NextResponse.json(
        { error: "마스터 사용자만 이관 요청을 수락할 수 있습니다." },
        { status: 403 },
      );
    }

    const accepted = await prisma.$transaction(async (tx) => {
      const pending =
        await tx.agentOrganizationCompanyTransferRequest.findUnique({
          where: {
            companyId: auth.user.currentCompanyId,
          },
          select: {
            companyId: true,
            toAgentOrganizationId: true,
            fromAgentOrganization: {
              select: {
                id: true,
                organizationName: true,
                organizationNumber: true,
              },
            },
            toAgentOrganization: {
              select: {
                id: true,
                organizationName: true,
                organizationNumber: true,
              },
            },
          },
        });

      if (!pending) {
        return null;
      }

      await tx.agentOrganizationCompany.upsert({
        where: {
          companyId: pending.companyId,
        },
        update: {
          agentOrganizationId: pending.toAgentOrganizationId,
        },
        create: {
          companyId: pending.companyId,
          agentOrganizationId: pending.toAgentOrganizationId,
        },
      });

      await tx.agentOrganizationCompanyTransferRequest.delete({
        where: {
          companyId: pending.companyId,
        },
      });

      return pending;
    });

    if (!accepted) {
      return NextResponse.json(
        { error: "수락할 이관 요청이 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "요청을 수락했습니다. 담당 에이전트가 변경되었습니다.",
      fromOrganization: accepted.fromAgentOrganization
        ? {
            id: accepted.fromAgentOrganization.id.toString(),
            organizationNumber: accepted.fromAgentOrganization.organizationNumber,
            organizationName: accepted.fromAgentOrganization.organizationName,
          }
        : null,
      toOrganization: {
        id: accepted.toAgentOrganization.id.toString(),
        organizationNumber: accepted.toAgentOrganization.organizationNumber,
        organizationName: accepted.toAgentOrganization.organizationName,
      },
    });
  } catch (error) {
    console.error("Company transfer request POST error:", error);
    return NextResponse.json(
      { error: "이관 요청 수락에 실패했습니다." },
      { status: 500 },
    );
  }
}
