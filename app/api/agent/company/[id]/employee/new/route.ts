import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import type { EmployeeCreateBody } from "@/types/company/employees";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    let companyId: bigint;
    try {
      companyId = BigInt(id);
    } catch {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
        { status: 400 },
      );
    }

    // 권한 확인
    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId,
        },
      },
      select: { companyId: true },
    });

    if (!companyLink) {
      return NextResponse.json(
        { error: "접근 권한이 없는 사업자입니다." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as EmployeeCreateBody;

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        name,
        residentNumber: body.residentNumber?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        hireDate: body.hireDate?.trim() || null,
        resignDate: body.resignDate?.trim() || null,
        zipcode: body.zipcode?.trim() || null,
        address: body.address?.trim() || null,
        addressDetail: body.addressDetail?.trim() || null,
        bankAccounts: {
          create:
            body.bankAccounts
              ?.filter((ba) => ba.bankName?.trim() && ba.accountNumber?.trim())
              .map((ba) => ({
                bankName: ba.bankName.trim(),
                accountNumber: ba.accountNumber.trim(),
                accountHolder: ba.accountHolder?.trim() || name,
              })) ?? [],
        },
      },
    });

    return NextResponse.json({
      id: employee.id.toString(),
      name: employee.name,
    });
  } catch (error) {
    console.error("Agent employee create error:", error);
    return NextResponse.json(
      { error: "직원 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
