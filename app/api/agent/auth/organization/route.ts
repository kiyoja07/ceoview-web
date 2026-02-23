import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import type { CreateOrganizationBody } from "@/types/agent/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = getAgentUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const currentUser = await prisma.agentUser.findUnique({
      where: { id: userId },
      select: { id: true, agentOrganizationId: true, isActive: true },
    });

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    if (currentUser.agentOrganizationId) {
      return NextResponse.json(
        { error: "이미 소속된 에이전트 조직이 있습니다." },
        { status: 409 },
      );
    }

    const body = (await request.json()) as CreateOrganizationBody;
    const rawOrganizationNumber = body.organizationNumber?.trim() ?? "";
    const organizationNumber = rawOrganizationNumber.replace(/\D/g, "");
    const businessType = body.businessType;
    const organizationName = body.organizationName?.trim() || null;
    const representativeName = body.representativeName?.trim() || null;
    const openingDate = body.openingDate?.trim() || null;
    const address = body.address?.trim() || null;

    if (!organizationNumber || !businessType) {
      return NextResponse.json(
        { error: "사업자번호와 사업자구분은 필수입니다." },
        { status: 400 },
      );
    }

    if (organizationNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 숫자 10자리여야 합니다." },
        { status: 400 },
      );
    }

    if (!["INDIVIDUAL", "CORPORATION"].includes(businessType)) {
      return NextResponse.json(
        { error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다." },
        { status: 400 },
      );
    }

    const organization = await prisma.$transaction(async (tx) => {
      const created = await tx.agentOrganization.create({
        data: {
          organizationNumber,
          businessType,
          organizationName,
          representativeName,
          openingDate: openingDate ? new Date(openingDate) : null,
          address,
        },
      });

      await tx.agentUser.update({
        where: { id: userId },
        data: { agentOrganizationId: created.id, isMaster: true },
      });

      return created;
    });

    return NextResponse.json(
      {
        id: organization.id.toString(),
        organizationNumber: organization.organizationNumber,
        businessType: organization.businessType,
        organizationName: organization.organizationName,
        representativeName: organization.representativeName,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Create agent organization error:", error);

    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "이미 등록된 사업자번호입니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "에이전트 조직 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
