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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const scope = searchParams.get("scope")?.trim();

    const baseWhere = {
      companyId: auth.currentCompanyId,
      ...(scope ? { scope: scope as "EMPLOYEE" | "COMPANY_INFO" } : {}),
    };
    const where = {
      ...baseWhere,
      ...(status
        ? {
            status: status as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "CANCELLED",
          }
        : {}),
    };

    const [items, summary] = await Promise.all([
      prisma.companyChangeRequest.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.companyChangeRequest.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const counts = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    for (const item of summary) {
      counts.total += item._count._all;
      if (item.status === "PENDING") counts.pending = item._count._all;
      if (item.status === "APPROVED") counts.approved = item._count._all;
      if (item.status === "REJECTED") counts.rejected = item._count._all;
      if (item.status === "CANCELLED") counts.cancelled = item._count._all;
    }

    return NextResponse.json({
      items: items.map((item) => serializeCompanyChangeRequest(item)),
      total: items.length,
      summary: counts,
    });
  } catch (error) {
    console.error("Company requests GET error:", error);
    return NextResponse.json(
      { error: "요청 이력을 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}
