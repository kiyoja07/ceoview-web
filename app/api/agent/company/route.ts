import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
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

  return { organizationId: user.agentOrganizationId } as const;
}

// GET: 전체 목록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
    });

    // BigInt → string 변환 (JSON 직렬화)
    const data = companies.map((company) => ({
      ...company,
      id: company.id.toString(),
    }));

    return NextResponse.json(data);
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
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      businessNumber,
      businessType,
      businessName,
      representativeName,
      address,
      openingDate,
    } = body;

    // 유효성 검사
    if (!businessNumber || !businessType) {
      return NextResponse.json(
        { error: "사업자번호와 사업자구분은 필수입니다." },
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

    if (!["INDIVIDUAL", "CORPORATION"].includes(businessType)) {
      return NextResponse.json(
        { error: "사업자구분은 INDIVIDUAL 또는 CORPORATION이어야 합니다." },
        { status: 400 },
      );
    }

    const company = await prisma.company.create({
      data: {
        businessNumber: cleanNumber,
        businessType,
        businessName: businessName || null,
        representativeName: representativeName || null,
        address: address || null,
        openingDate: openingDate ? new Date(openingDate) : null,
      },
    });

    return NextResponse.json(
      {
        ...company,
        id: company.id.toString(),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Company POST error:", error);

    // 중복 사업자번호 처리
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
      { error: "등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
