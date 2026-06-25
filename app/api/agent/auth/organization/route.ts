import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { validateOrganizationPhone } from "@/app/lib/organization-phone";
import type { CreateOrganizationBody } from "@/types/agent/auth";
import type { BusinessType } from "@/types/agent/company";

type ParsedOrganizationInput = {
  organizationNumber: string;
  businessType: BusinessType;
  organizationName: string | null;
  representativeName: string | null;
  phone: string | null;
  openingDate: Date | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
};

type ParsedAgentProfileInput = {
  name?: string;
  phone?: string | null;
};

function parseOrganizationBody(body: CreateOrganizationBody) {
  const rawOrganizationNumber = body.organizationNumber?.trim() ?? "";
  const organizationNumber = rawOrganizationNumber.replace(/\D/g, "");
  const businessType = body.businessType;
  const organizationName = body.organizationName?.trim() || null;
  const representativeName = body.representativeName?.trim() || null;
  const phoneRaw = body.phone?.trim() ?? "";
  const openingDateRaw = body.openingDate?.trim() || null;
  const zipcode = body.zipcode?.trim() || null;
  const address = body.address?.trim() || null;
  const addressDetail = body.addressDetail?.trim() || null;

  if (!organizationNumber || !businessType) {
    return {
      error: "사업자번호와 사업자구분은 필수입니다.",
      status: 400,
    } as const;
  }

  if (organizationNumber.length !== 10) {
    return {
      error: "사업자번호는 숫자 10자리여야 합니다.",
      status: 400,
    } as const;
  }

  if (!(["INDIVIDUAL", "CORPORATION"] as const).includes(businessType)) {
    return {
      error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다.",
      status: 400,
    } as const;
  }

  const phoneError = validateOrganizationPhone(phoneRaw);
  if (phoneError) {
    return {
      error: phoneError,
      status: 400,
    } as const;
  }

  const openingDate = openingDateRaw ? new Date(openingDateRaw) : null;
  if (openingDate && Number.isNaN(openingDate.getTime())) {
    return {
      error: "개업일 형식이 올바르지 않습니다.",
      status: 400,
    } as const;
  }

  return {
    data: {
      organizationNumber,
      businessType,
      organizationName,
      representativeName,
      phone: phoneRaw ? phoneRaw.slice(0, 30) : null,
      openingDate,
      zipcode: zipcode ? zipcode.slice(0, 10) : null,
      address,
      addressDetail: addressDetail ? addressDetail.slice(0, 255) : null,
    } satisfies ParsedOrganizationInput,
  } as const;
}

function parseAgentProfileBody(body: CreateOrganizationBody) {
  const result: ParsedAgentProfileInput = {};

  if (typeof body.userName === "string") {
    const name = body.userName.trim();
    if (name.length > 0) {
      result.name = name.slice(0, 100);
    }
  }

  if (typeof body.userPhone === "string") {
    const phone = body.userPhone.trim();
    result.phone = phone.length > 0 ? phone.slice(0, 30) : null;
  }

  return result;
}

async function requireActiveAgentUser(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "인증이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isMaster: true,
      isActive: true,
      agentOrganizationId: true,
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

    if (!auth.user.agentOrganizationId) {
      return NextResponse.json(
        { error: "소속된 에이전트 조직이 없습니다." },
        { status: 403 },
      );
    }

    const organization = await prisma.agentOrganization.findUnique({
      where: { id: auth.user.agentOrganizationId },
      select: {
        id: true,
        organizationNumber: true,
        businessType: true,
        organizationName: true,
        representativeName: true,
        phone: true,
        openingDate: true,
        zipcode: true,
        address: true,
        addressDetail: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "소속된 에이전트 조직이 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: {
        id: auth.user.id.toString(),
        email: auth.user.email,
        name: auth.user.name,
        isMaster: auth.user.isMaster,
      },
      organization: {
        ...organization,
        id: organization.id.toString(),
        openingDate: organization.openingDate
          ? organization.openingDate.toISOString().slice(0, 10)
          : null,
      },
    });
  } catch (error) {
    console.error("Get agent organization error:", error);
    return NextResponse.json(
      { error: "에이전트 조직 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveAgentUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user.agentOrganizationId) {
      return NextResponse.json(
        { error: "이미 소속된 에이전트 조직이 있습니다." },
        { status: 409 },
      );
    }

    const body = (await request.json()) as CreateOrganizationBody;
    const parsed = parseOrganizationBody(body);
    const parsedAgentProfile = parseAgentProfileBody(body);
    if ("error" in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }

    const organization = await prisma.$transaction(async (tx) => {
      const created = await tx.agentOrganization.create({
        data: parsed.data,
      });

      const userUpdateData: {
        agentOrganizationId: string;
        isMaster: boolean;
        name?: string;
        phone?: string | null;
      } = {
        agentOrganizationId: created.id,
        isMaster: true,
      };
      if (parsedAgentProfile.name !== undefined) {
        userUpdateData.name = parsedAgentProfile.name;
      }
      if (parsedAgentProfile.phone !== undefined) {
        userUpdateData.phone = parsedAgentProfile.phone;
      }

      await tx.agentUser.update({
        where: { id: auth.user.id },
        data: userUpdateData,
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
        phone: organization.phone,
        zipcode: organization.zipcode,
        address: organization.address,
        addressDetail: organization.addressDetail,
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
      { error: "세무대리인 조직 생성에 실패했습니다." },
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

    if (!auth.user.agentOrganizationId) {
      return NextResponse.json(
        { error: "소속된 에이전트 조직이 없습니다." },
        { status: 403 },
      );
    }

    if (!auth.user.isMaster) {
      return NextResponse.json(
        { error: "조직 정보 수정은 마스터 권한이 필요합니다." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateOrganizationBody;
    const parsed = parseOrganizationBody(body);
    if ("error" in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }

    const updated = await prisma.agentOrganization.update({
      where: { id: auth.user.agentOrganizationId },
      data: parsed.data,
      select: {
        id: true,
        organizationNumber: true,
        businessType: true,
        organizationName: true,
        representativeName: true,
        phone: true,
        openingDate: true,
        zipcode: true,
        address: true,
        addressDetail: true,
      },
    });

    return NextResponse.json({
      id: updated.id.toString(),
      organizationNumber: updated.organizationNumber,
      businessType: updated.businessType,
      organizationName: updated.organizationName,
      representativeName: updated.representativeName,
      phone: updated.phone,
      openingDate: updated.openingDate
        ? updated.openingDate.toISOString().slice(0, 10)
        : null,
      zipcode: updated.zipcode,
      address: updated.address,
      addressDetail: updated.addressDetail,
    });
  } catch (error: unknown) {
    console.error("Update agent organization error:", error);

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
      { error: "에이전트 조직 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
