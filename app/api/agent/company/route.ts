import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { deriveBusinessType } from "@/app/lib/business-type";

async function requireAgentAuth(request: NextRequest) {
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

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function serializeCompany(company: {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  openingDate: Date | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...company,
    id: company.id.toString(),
  };
}

// GET: 페이지네이션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const where = {
      organizationLink: {
        is: {
          agentOrganizationId: auth.organizationId,
        },
      },
    };

    // 급여 업로드 화면 등 기존 호출 호환을 위해 page/size가 없으면 배열로 반환
    if (!searchParams.has("page") && !searchParams.has("size")) {
      const companies = await prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(companies.map(serializeCompany));
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const size = Math.min(
      100,
      Math.max(1, Number(searchParams.get("size")) || 50),
    );

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.company.count({ where }),
    ]);

    const items = companies.map(serializeCompany);

    return NextResponse.json({
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    });
  } catch (error) {
    console.error("Company GET error:", error);
    return NextResponse.json(
      { error: "목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST: 새 사업자 등록
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      businessNumber,
      businessName,
      representativeName,
      address,
      openingDate,
    } = body;

    // 유효성 검사
    if (!businessNumber) {
      return NextResponse.json(
        { error: "사업자번호는 필수입니다." },
        { status: 400 },
      );
    }

    // 사업자번호 숫자만 추출 (하이픈 제거)
    const cleanNumber = businessNumber.replace(/\D/g, "");
    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { error: "사업자번호는 10자리여야 합니다." },
        { status: 400 },
      );
    }

    // 사업자구분은 사업자번호에서 자동 판별
    const businessType = deriveBusinessType(cleanNumber);

    const result = await prisma.$transaction(async (tx) => {
      let company = await tx.company.findUnique({
        where: { businessNumber: cleanNumber },
      });
      let created = false;
      let pendingApproval = false;
      let alreadyLinked = false;

      if (!company) {
        try {
          company = await tx.company.create({
            data: {
              businessNumber: cleanNumber,
              businessType,
              businessName: businessName || null,
              representativeName: representativeName || null,
              address: address || null,
              openingDate: openingDate ? new Date(openingDate) : null,
            },
          });
          created = true;
        } catch (error) {
          if (!isUniqueConstraintError(error)) {
            throw error;
          }
          company = await tx.company.findUnique({
            where: { businessNumber: cleanNumber },
          });
        }
      }

      if (!company) {
        throw new Error("사업자 정보를 처리할 수 없습니다.");
      }

      const activeLink = await tx.agentOrganizationCompany.findUnique({
        where: { companyId: company.id },
        select: { agentOrganizationId: true },
      });

      // 오너가 있는 기존 회사는 회사 승인 전까지 연결 요청 상태로 유지
      if (!activeLink) {
        const userCount = await tx.companyUser.count({
          where: { companyId: company.id },
        });

        if (userCount === 0) {
          await tx.agentOrganizationCompany.upsert({
            where: { companyId: company.id },
            update: {
              agentOrganizationId: auth.organizationId,
            },
            create: {
              agentOrganizationId: auth.organizationId,
              companyId: company.id,
            },
          });

          await tx.agentOrganizationCompanyTransferRequest.deleteMany({
            where: { companyId: company.id },
          });
        } else {
          const existingRequest =
            await tx.agentOrganizationCompanyTransferRequest.findUnique({
              where: { companyId: company.id },
              select: { toAgentOrganizationId: true },
            });

          if (
            existingRequest &&
            existingRequest.toAgentOrganizationId !== auth.organizationId
          ) {
            return {
              error: "이미 다른 에이전트의 연결 요청이 대기 중입니다.",
              status: 409,
            } as const;
          }

          await tx.agentOrganizationCompanyTransferRequest.upsert({
            where: { companyId: company.id },
            update: {
              fromAgentOrganizationId: null,
              toAgentOrganizationId: auth.organizationId,
              requestedByAgentUserId: auth.userId,
            },
            create: {
              companyId: company.id,
              fromAgentOrganizationId: null,
              toAgentOrganizationId: auth.organizationId,
              requestedByAgentUserId: auth.userId,
            },
          });
          pendingApproval = true;
        }
      } else if (activeLink.agentOrganizationId === auth.organizationId) {
        // 이미 같은 에이전트가 활성 연결된 경우
        alreadyLinked = true;
        await tx.agentOrganizationCompanyTransferRequest.deleteMany({
          where: {
            companyId: company.id,
            toAgentOrganizationId: auth.organizationId,
          },
        });
      } else {
        // 기존 회사는 회사 수락 전까지 이관 요청 상태로 유지
        const existingRequest =
          await tx.agentOrganizationCompanyTransferRequest.findUnique({
            where: { companyId: company.id },
            select: { toAgentOrganizationId: true },
          });

        if (
          existingRequest &&
          existingRequest.toAgentOrganizationId !== auth.organizationId
        ) {
          return {
            error: "이미 다른 에이전트의 이관 요청이 대기 중입니다.",
            status: 409,
          } as const;
        }

        await tx.agentOrganizationCompanyTransferRequest.upsert({
          where: { companyId: company.id },
          update: {
            fromAgentOrganizationId: activeLink.agentOrganizationId,
            toAgentOrganizationId: auth.organizationId,
            requestedByAgentUserId: auth.userId,
          },
          create: {
            companyId: company.id,
            fromAgentOrganizationId: activeLink.agentOrganizationId,
            toAgentOrganizationId: auth.organizationId,
            requestedByAgentUserId: auth.userId,
          },
        });
        pendingApproval = true;
      }

      return {
        company,
        created,
        pendingApproval,
        alreadyLinked,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        ...serializeCompany(result.company),
        created: result.created,
        pendingApproval: result.pendingApproval,
        alreadyLinked: result.alreadyLinked,
      },
      { status: result.pendingApproval ? 202 : result.created ? 201 : 200 },
    );
  } catch (error: unknown) {
    console.error("Company POST error:", error);

    return NextResponse.json(
      { error: "등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
