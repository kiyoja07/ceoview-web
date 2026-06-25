import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { sanitizeCompanyInfoRequestPayload } from "@/app/lib/company-change-request";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

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

  return { userId, organizationId: user.agentOrganizationId } as const;
}

function parseCompanyId(id: string) {
  try {
    return { companyId: id };
  } catch {
    return { error: "유효한 거래처 ID가 아닙니다." };
  }
}

// GET: 거래처 상세 정보 조회
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
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: parsed.companyId,
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
        openingDate: true,
        zipcode: true,
        address: true,
        addressDetail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: toId(company.id),
      businessNumber: company.businessNumber,
      businessType: company.businessType,
      businessName: company.businessName,
      representativeName: company.representativeName,
      openingDate: company.openingDate
        ? company.openingDate.toISOString().slice(0, 10)
        : null,
      zipcode: company.zipcode,
      address: company.address,
      addressDetail: company.addressDetail,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Agent company info GET error:", error);
    return NextResponse.json(
      { error: "거래처 정보 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// PATCH: 거래처 정보 수정
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
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // 거래처가 해당 조직 소속인지 확인
    const company = await prisma.company.findFirst({
      where: {
        id: parsed.companyId,
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: "거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const requestIdRaw =
      body && typeof body.requestId === "string" ? body.requestId.trim() : "";
    const sanitizedBody = sanitizeCompanyInfoRequestPayload(
      (body ?? {}) as {
        businessName?: string | null;
        representativeName?: string | null;
        openingDate?: string | null;
        zipcode?: string | null;
        address?: string | null;
        addressDetail?: string | null;
      },
    );
    const {
      businessName,
      representativeName,
      openingDate,
      zipcode,
      address,
      addressDetail,
    } = sanitizedBody;

    if (openingDate && Number.isNaN(new Date(openingDate).getTime())) {
      return NextResponse.json(
        { error: "개업일 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    let parsedRequestId: string | null = null;
    if (requestIdRaw) {
      try {
        parsedRequestId = requestIdRaw;
      } catch {
        return NextResponse.json(
          { error: "유효한 요청 ID가 아닙니다." },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsedRequestId) {
        const changeRequest = await tx.companyChangeRequest.findFirst({
          where: {
            id: parsedRequestId,
            companyId: parsed.companyId,
            scope: "COMPANY_INFO",
            action: "UPDATE",
            status: "PENDING",
            company: {
              organizationLink: {
                is: { agentOrganizationId: auth.organizationId },
              },
            },
          },
          select: { id: true },
        });

        if (!changeRequest) {
          return null;
        }
      }

      const updatedCompany = await tx.company.update({
        where: { id: parsed.companyId },
        data: {
          businessName: businessName ?? null,
          representativeName: representativeName ?? null,
          openingDate: openingDate ? new Date(openingDate) : null,
          zipcode: zipcode ?? null,
          address: address ?? null,
          addressDetail: addressDetail ?? null,
        },
        select: {
          id: true,
          businessNumber: true,
          businessType: true,
          businessName: true,
          representativeName: true,
          openingDate: true,
          zipcode: true,
          address: true,
          addressDetail: true,
          updatedAt: true,
        },
      });

      if (parsedRequestId) {
        await tx.companyChangeRequest.update({
          where: { id: parsedRequestId },
          data: {
            status: "APPROVED",
            resolvedAt: new Date(),
            resolvedByAgentUserId: auth.userId,
            resolutionComment: null,
          },
        });
      }

      return updatedCompany;
    });

    if (!updated) {
      return NextResponse.json(
        { error: "처리 가능한 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: toId(updated.id),
      businessNumber: updated.businessNumber,
      businessType: updated.businessType,
      businessName: updated.businessName,
      representativeName: updated.representativeName,
      openingDate: updated.openingDate
        ? updated.openingDate.toISOString().slice(0, 10)
        : null,
      zipcode: updated.zipcode,
      address: updated.address,
      addressDetail: updated.addressDetail,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Agent company info PATCH error:", error);
    return NextResponse.json(
      { error: "거래처 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
