import { NextRequest, NextResponse } from "next/server";
import { getShowcaseBySlug } from "@/catalogs/showcase";
import { buildShowcaseUrl, buildUrlForAudience } from "@/app/lib/audience-routing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { error: "공개 슬러그가 필요합니다." },
        { status: 400 },
      );
    }

    const scenario = getShowcaseBySlug(slug);
    if (!scenario) {
      return NextResponse.json(
        { error: "공개 쇼케이스를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...scenario,
      links: {
        self: buildShowcaseUrl(slug, request),
        companyApp: buildUrlForAudience("company", "/company", request),
        agentApp: buildUrlForAudience("agent", "/agent/company", request),
        employeeApp: buildUrlForAudience("employee", "/employee", request),
      },
    });
  } catch (error) {
    console.error("Public showcase GET error:", error);
    return NextResponse.json(
      { error: "공개 쇼케이스 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}
