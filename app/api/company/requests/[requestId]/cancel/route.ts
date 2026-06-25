import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { serializeCompanyChangeRequest } from "@/app/lib/company-change-request";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { requestId } = await params;
    let parsedRequestId: string;
    try {
      parsedRequestId = requestId;
    } catch {
      return NextResponse.json(
        { error: "유효한 요청 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const existing = await prisma.companyChangeRequest.findFirst({
      where: {
        id: parsedRequestId,
        companyId: auth.currentCompanyId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "취소 가능한 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const item = await prisma.companyChangeRequest.update({
      where: { id: parsedRequestId },
      data: {
        status: "CANCELLED",
        resolvedAt: new Date(),
      },
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
    });

    return NextResponse.json({
      item: serializeCompanyChangeRequest(item),
    });
  } catch (error) {
    console.error("Company request cancel error:", error);
    return NextResponse.json(
      { error: "요청 취소에 실패했습니다." },
      { status: 500 },
    );
  }
}
