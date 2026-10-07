import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  type CompanyFeatureFlags,
  resolveCompanyFeatureFlags,
} from "@/types/company/features";

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

// GET: 거래처에 제공 중인 기능 조회
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

    const link = await prisma.agentOrganizationCompany.findFirst({
      where: {
        companyId: id,
        agentOrganizationId: auth.organizationId,
      },
      select: {
        salaryFeatureEnabled: true,
        financialReportFeatureEnabled: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      features: resolveCompanyFeatureFlags(link),
    });
  } catch (error) {
    console.error("Agent company features GET error:", error);
    return NextResponse.json(
      { error: "제공 기능 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// PATCH: 거래처에 제공하는 기능 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const link = await prisma.agentOrganizationCompany.findFirst({
      where: {
        companyId: id,
        agentOrganizationId: auth.organizationId,
      },
      select: { id: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: "거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => null)) as Partial<
      CompanyFeatureFlags
    > | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 },
      );
    }

    const data: {
      salaryFeatureEnabled?: boolean;
      financialReportFeatureEnabled?: boolean;
    } = {};

    if (typeof body.salary === "boolean") {
      data.salaryFeatureEnabled = body.salary;
    }
    if (typeof body.financialReport === "boolean") {
      data.financialReportFeatureEnabled = body.financialReport;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "변경할 기능이 없습니다." },
        { status: 400 },
      );
    }

    const updated = await prisma.agentOrganizationCompany.update({
      where: { id: link.id },
      data,
      select: {
        salaryFeatureEnabled: true,
        financialReportFeatureEnabled: true,
      },
    });

    return NextResponse.json({
      features: resolveCompanyFeatureFlags(updated),
    });
  } catch (error) {
    console.error("Agent company features PATCH error:", error);
    return NextResponse.json(
      { error: "제공 기능 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
