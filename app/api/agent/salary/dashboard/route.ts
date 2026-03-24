import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  SALARY_INCOME_TYPE_LABELS,
  SALARY_INCOME_TYPES,
} from "@/catalogs/ko/salary";

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

/**
 * GET /api/agent/salary/dashboard
 *
 * Returns:
 * - summary: overall stats (total companies, companies with uploads, published count, etc.)
 * - companies: per-company salary status with latest upload info per income type
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch all companies linked to this agent organization
    const companies = await prisma.company.findMany({
      where: {
        organizationLink: {
          is: { agentOrganizationId: auth.organizationId },
        },
      },
      select: {
        id: true,
        businessNumber: true,
        businessType: true,
        businessName: true,
        representativeName: true,
      },
      orderBy: { businessName: "asc" },
    });

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalCompanies: 0,
          companiesWithUploads: 0,
          companiesFullyPublished: 0,
          totalUploads: 0,
          totalPublished: 0,
        },
        companies: [],
      });
    }

    const companyIds = companies.map((c) => c.id);

    // Fetch all uploads for these companies (latest per company+type)
    const uploads = await prisma.upload.findMany({
      where: { companyId: { in: companyIds } },
      select: {
        id: true,
        companyId: true,
        type: true,
        fileName: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: "desc" },
    });

    // Fetch all active upload pointers (published state)
    const activeUploads = await prisma.companyActiveUpload.findMany({
      where: { companyId: { in: companyIds } },
      select: {
        companyId: true,
        type: true,
        uploadId: true,
        updatedAt: true,
      },
    });

    // Build lookup: companyId -> type -> latest upload
    const latestUploadMap = new Map<
      string,
      Map<
        string,
        {
          uploadId: string;
          fileName: string | null;
          uploadedAt: Date;
        }
      >
    >();
    for (const upload of uploads) {
      const companyKey = upload.companyId.toString();
      if (!latestUploadMap.has(companyKey)) {
        latestUploadMap.set(companyKey, new Map());
      }
      const typeMap = latestUploadMap.get(companyKey)!;
      // Only keep the first (latest) per type since we sorted desc
      if (!typeMap.has(upload.type)) {
        typeMap.set(upload.type, {
          uploadId: upload.id.toString(),
          fileName: upload.fileName,
          uploadedAt: upload.uploadedAt,
        });
      }
    }

    // Build lookup: companyId -> type -> active upload (published)
    const activeUploadMap = new Map<
      string,
      Map<string, { uploadId: string; publishedAt: Date }>
    >();
    for (const active of activeUploads) {
      const companyKey = active.companyId.toString();
      if (!activeUploadMap.has(companyKey)) {
        activeUploadMap.set(companyKey, new Map());
      }
      activeUploadMap.get(companyKey)!.set(active.type, {
        uploadId: active.uploadId.toString(),
        publishedAt: active.updatedAt,
      });
    }

    // Count totals for uploads per company
    const uploadCountMap = new Map<string, number>();
    for (const upload of uploads) {
      const key = upload.companyId.toString();
      uploadCountMap.set(key, (uploadCountMap.get(key) ?? 0) + 1);
    }

    // Build per-company result
    let companiesWithUploads = 0;
    let companiesFullyPublished = 0;
    let totalUploads = 0;
    let totalPublished = 0;

    const companyResults = companies.map((company) => {
      const companyKey = company.id.toString();
      const typeMap = latestUploadMap.get(companyKey);
      const activeMap = activeUploadMap.get(companyKey);
      const uploadCount = uploadCountMap.get(companyKey) ?? 0;
      totalUploads += uploadCount;

      const hasAnyUpload = !!typeMap && typeMap.size > 0;
      if (hasAnyUpload) companiesWithUploads++;

      const incomeTypes = SALARY_INCOME_TYPES.map((type) => {
        const latestUpload = typeMap?.get(type) ?? null;
        const activePointer = activeMap?.get(type) ?? null;
        const isPublished = !!activePointer;
        if (isPublished) totalPublished++;

        return {
          type,
          label: SALARY_INCOME_TYPE_LABELS[type],
          hasUpload: !!latestUpload,
          isPublished,
          latestUpload: latestUpload
            ? {
                uploadId: latestUpload.uploadId,
                fileName: latestUpload.fileName,
                uploadedAt: latestUpload.uploadedAt.toISOString(),
              }
            : null,
          publishedAt: activePointer?.publishedAt.toISOString() ?? null,
        };
      });

      const publishedCount = incomeTypes.filter((t) => t.isPublished).length;
      const uploadedCount = incomeTypes.filter((t) => t.hasUpload).length;
      const isFullyPublished =
        publishedCount === uploadedCount && uploadedCount > 0;
      if (isFullyPublished) companiesFullyPublished++;

      return {
        id: company.id.toString(),
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessName: company.businessName,
        representativeName: company.representativeName,
        uploadCount,
        uploadedTypeCount: uploadedCount,
        publishedTypeCount: publishedCount,
        isFullyPublished,
        incomeTypes,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalCompanies: companies.length,
        companiesWithUploads,
        companiesFullyPublished,
        totalUploads,
        totalPublished,
      },
      companies: companyResults,
    });
  } catch (error) {
    console.error("Salary dashboard error:", error);
    return NextResponse.json(
      { error: "급여 현황 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
