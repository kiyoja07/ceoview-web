import { NextRequest, NextResponse } from "next/server";
import {
  resolveCompanyAccessContext,
} from "@/app/lib/company-access";
import { attachCompanySelection } from "@/app/lib/company-auth";
import { isCompanyProfileComplete } from "@/app/lib/company-onboarding";

type SelectCompanyBody = {
  companyId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const context = await resolveCompanyAccessContext(request);
    if (!context) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as SelectCompanyBody;
    if (!body.companyId) {
      return NextResponse.json(
        { error: "선택할 회사가 필요합니다." },
        { status: 400 },
      );
    }

    let nextCompanyId: string;
    try {
      nextCompanyId = body.companyId;
    } catch {
      return NextResponse.json(
        { error: "유효한 회사 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const nextCompany =
      context.companies.find((company) => company.id === nextCompanyId) ?? null;
    if (!nextCompany) {
      return NextResponse.json(
        { error: "선택 가능한 회사가 아닙니다." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      success: true,
      currentCompanyId: nextCompany.id.toString(),
      profileComplete: isCompanyProfileComplete(nextCompany.address),
      company: {
        id: nextCompany.id.toString(),
        businessNumber: nextCompany.businessNumber,
        businessType: nextCompany.businessType,
        businessName: nextCompany.businessName,
        representativeName: nextCompany.representativeName,
      },
    });

    attachCompanySelection(response, nextCompany.id);
    return response;
  } catch (error) {
    console.error("Company select-company POST error:", error);
    return NextResponse.json(
      { error: "회사 선택을 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
