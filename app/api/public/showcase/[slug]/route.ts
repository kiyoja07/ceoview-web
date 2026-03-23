import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(
  _request: Request,
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

    const company = await prisma.company.findFirst({
      where: {
        publicSlug: slug,
        isDemo: true,
        isPublicShowcase: true,
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
        openingDate: true,
        address: true,
        organizationLink: {
          select: {
            agentOrganization: {
              select: {
                id: true,
                organizationName: true,
                organizationNumber: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "공개 쇼케이스를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      company: {
        id: company.id.toString(),
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessName: company.businessName,
        representativeName: company.representativeName,
        openingDate: company.openingDate
          ? company.openingDate.toISOString().slice(0, 10)
          : null,
        address: company.address,
      },
      organization: company.organizationLink?.agentOrganization
        ? {
            id: company.organizationLink.agentOrganization.id.toString(),
            organizationName:
              company.organizationLink.agentOrganization.organizationName,
            organizationNumber:
              company.organizationLink.agentOrganization.organizationNumber,
          }
        : null,
      links: {
        salaryDashboard: `/company/${company.id.toString()}/salary`,
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
