import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  sanitizeCompanyInfoRequestPayload,
  serializePendingRequestSummary,
  snapshotCompanyInfoRecord,
} from "@/app/lib/company-change-request";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import type { CompanyInfoUpdateBody } from "@/types/company/users";

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function serializeCompany(company: {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  openingDate: Date | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
  organizationLink?: {
    agentOrganizationId: string;
  } | null;
}) {
  return {
    id: company.id.toString(),
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
    organizationLink: company.organizationLink
      ? {
          agentOrganizationId:
            company.organizationLink.agentOrganizationId.toString(),
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [company, pendingRequest] = await Promise.all([
      prisma.company.findUnique({
        where: { id: auth.currentCompanyId },
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
          organizationLink: { select: { agentOrganizationId: true } },
        },
      }),
      prisma.companyChangeRequest.findFirst({
        where: {
          companyId: auth.currentCompanyId,
          scope: "COMPANY_INFO",
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          scope: true,
          action: true,
          status: true,
          targetEmployeeId: true,
          requestedPayload: true,
          currentSnapshot: true,
          resolutionComment: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: "회사 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      canManageCompanyInfo: auth.isMaster,
      company: serializeCompany(company),
      pendingRequest: pendingRequest
        ? serializePendingRequestSummary(pendingRequest)
        : null,
    });
  } catch (error) {
    console.error("Company info GET error:", error);
    return NextResponse.json(
      { error: "회사 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: "회사 정보 변경은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const body = sanitizeCompanyInfoRequestPayload(
      (await request.json()) as CompanyInfoUpdateBody,
    );

    // businessType은 클라이언트 입력을 무시하고, 사업자번호에서 자동 판별
    // (사업자번호는 변경 불가이므로 DB에서 현재 값을 조회하여 판별)

    const businessName = body.businessName ?? null;
    const representativeName = body.representativeName ?? null;
    const zipcode = body.zipcode ?? null;
    const address = body.address ?? null;
    const addressDetail = body.addressDetail ?? null;
    const openingDateRaw = body.openingDate ?? null;

    if (openingDateRaw && Number.isNaN(new Date(openingDateRaw).getTime())) {
      return NextResponse.json(
        { error: "개업일 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: auth.currentCompanyId },
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
        organizationLink: { select: { agentOrganizationId: true } },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "회사 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const existingPendingRequest = await prisma.companyChangeRequest.findFirst({
      where: {
        companyId: auth.currentCompanyId,
        scope: "COMPANY_INFO",
        action: "UPDATE",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: "이미 처리 대기 중인 회사 정보 변경 요청이 있습니다." },
        { status: 409 },
      );
    }

    const requestedPayload = {
      businessName,
      representativeName,
      openingDate: openingDateRaw,
      zipcode,
      address,
      addressDetail,
    };
    const currentSnapshot = snapshotCompanyInfoRecord(company);

    const requestSelect = {
      id: true,
      scope: true,
      action: true,
      status: true,
      targetEmployeeId: true,
      requestedPayload: true,
      currentSnapshot: true,
      resolutionComment: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
    } as const;

    if (company.organizationLink) {
      const createdRequest = await prisma.companyChangeRequest.create({
        data: {
          scope: "COMPANY_INFO",
          action: "UPDATE",
          companyId: auth.currentCompanyId,
          requestedByCompanyUserId: auth.userId,
          requestedPayload,
          currentSnapshot,
        },
        select: requestSelect,
      });

      return NextResponse.json({
        success: true,
        request: serializePendingRequestSummary(createdRequest),
        message: "회사 정보 변경 요청이 제출되었습니다.",
      });
    }

    const [, approvedRequest] = await prisma.$transaction([
      prisma.company.update({
        where: { id: auth.currentCompanyId },
        data: {
          businessName,
          representativeName,
          openingDate: openingDateRaw ? new Date(openingDateRaw) : null,
          zipcode,
          address,
          addressDetail,
        },
      }),
      prisma.companyChangeRequest.create({
        data: {
          scope: "COMPANY_INFO",
          action: "UPDATE",
          status: "APPROVED",
          companyId: auth.currentCompanyId,
          requestedByCompanyUserId: auth.userId,
          resolvedByAgentUserId: null,
          requestedPayload,
          currentSnapshot,
          resolvedAt: new Date(),
        },
        select: requestSelect,
      }),
    ]);

    return NextResponse.json({
      success: true,
      request: serializePendingRequestSummary(approvedRequest),
      message: "회사 정보가 즉시 반영되었습니다.",
    });
  } catch (error) {
    console.error("Company info PATCH error:", error);
    return NextResponse.json(
      { error: "회사 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
