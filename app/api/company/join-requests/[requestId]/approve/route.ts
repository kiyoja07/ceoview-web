import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import {
  approveCompanyJoinRequest,
  COMPANY_JOIN_REQUEST_STATUS,
} from "@/app/lib/company-join-requests";
import prisma from "@/app/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const access = await resolveCompanyAccessContext(request);
    if (!access) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    if (!access.isMaster) {
      return NextResponse.json(
        { error: "가입 요청 승인은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const { requestId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const joinRequest = await tx.companyJoinRequest.findFirst({
        where: {
          id: requestId,
          companyId: access.currentCompanyId,
          status: COMPANY_JOIN_REQUEST_STATUS.pending,
        },
        select: { id: true },
      });

      if (!joinRequest) return null;

      return approveCompanyJoinRequest(tx, {
        requestId: joinRequest.id,
        actorType: "company",
        actorId: access.userId,
      });
    });

    if (!result) {
      return NextResponse.json(
        { error: "승인 가능한 가입 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: result.id.toString(),
      status: result.status,
      resolvedAt: result.resolvedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Company join request approve error:", error);
    return NextResponse.json(
      { error: "가입 요청 승인에 실패했습니다." },
      { status: 500 },
    );
  }
}
