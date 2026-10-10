import { NextRequest, NextResponse } from "next/server";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import { COMPANY_ONBOARDING_PENDING_MARKER } from "@/app/lib/company-onboarding";
import prisma from "@/app/lib/prisma";
import type { CompanySessionResponse } from "@/types/company/session";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * GET /api/company/session
 * 회사 화면 레이아웃이 현재 회사, 제공 기능, 온보딩 상태를 확인할 때 쓴다.
 * 선택한 회사는 company_selected_company 쿠키로 결정된다.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json<CompanySessionResponse>(
        { authenticated: false },
        { headers: NO_STORE },
      );
    }

    const access = await resolveCompanyAccessContext(request);
    if (!access) {
      return NextResponse.json<CompanySessionResponse>(
        { authenticated: true, company: null, onboarding: null },
        { headers: NO_STORE },
      );
    }

    let onboarding: "pending" | "required" | null = null;
    if (access.company.address === COMPANY_ONBOARDING_PENDING_MARKER) {
      const pendingRequest = await prisma.companyJoinRequest.findFirst({
        where: { companyUserId: userId, status: "PENDING" },
        select: { id: true },
      });
      onboarding = pendingRequest ? "pending" : "required";
    }

    return NextResponse.json<CompanySessionResponse>(
      {
        authenticated: true,
        company: {
          businessName: access.company.businessName,
          features: access.company.features,
        },
        onboarding,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("Company session error:", error);
    return NextResponse.json(
      { error: "회사 정보를 확인하지 못했습니다." },
      { status: 500 },
    );
  }
}
