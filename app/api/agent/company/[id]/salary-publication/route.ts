import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { INCOME_TYPE_LABELS } from "@/app/api/agent/salary/upload/constants";
import { publishUpload } from "@/app/api/agent/salary/upload/save-services";
import type { SalaryIncomeType } from "@/app/api/agent/salary/upload/types";

const UPLOAD_META_PREFIX = "__upload_meta__:";

type PublicationStatus = "SAVED" | "PUBLISHED";

type UploadRow = {
  id: bigint;
  companyId: bigint;
  type: SalaryIncomeType;
  fileName: string | null;
  uploadedAt: Date;
  memo: string | null;
};

type ActivePointerRow = {
  id: bigint;
  type: SalaryIncomeType;
  uploadId: bigint;
  updatedAt: Date;
};

function parseUploadedByAgentUserId(memo: string | null): bigint | null {
  if (!memo || !memo.startsWith(UPLOAD_META_PREFIX)) {
    return null;
  }

  const jsonPart = memo.slice(UPLOAD_META_PREFIX.length);
  try {
    const parsed = JSON.parse(jsonPart) as { uploadedByAgentUserId?: string };
    if (!parsed.uploadedByAgentUserId) return null;
    return BigInt(parsed.uploadedByAgentUserId);
  } catch {
    return null;
  }
}

function canManageUpload(memo: string | null, agentUserId: bigint) {
  const uploadedByAgentUserId = parseUploadedByAgentUserId(memo);
  if (uploadedByAgentUserId == null) return true;
  return uploadedByAgentUserId === agentUserId;
}

function parseCompanyId(id: string) {
  try {
    return { companyId: BigInt(id) } as const;
  } catch {
    return { error: "유효한 거래처 ID가 아닙니다." } as const;
  }
}

function parseUploadId(uploadId: string) {
  try {
    return { uploadId: BigInt(uploadId) } as const;
  } catch {
    return { error: "유효한 업로드 ID가 아닙니다." } as const;
  }
}

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

  return { userId, organizationId: user.agentOrganizationId } as const;
}

async function ensureCompanyAccess(companyId: bigint, organizationId: bigint) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      organizationLink: {
        is: { agentOrganizationId: organizationId },
      },
    },
    select: { id: true },
  });

  return Boolean(company);
}

async function findUploadInCompany(
  companyId: bigint,
  organizationId: bigint,
  uploadId: bigint,
) {
  return prisma.upload.findFirst({
    where: {
      id: uploadId,
      companyId,
      company: {
        organizationLink: {
          is: {
            agentOrganizationId: organizationId,
          },
        },
      },
    },
    select: {
      id: true,
      companyId: true,
      type: true,
      fileName: true,
      uploadedAt: true,
      memo: true,
    },
  });
}

async function setUploadToSaved(upload: UploadRow) {
  const pointer = await prisma.companyActiveUpload.findUnique({
    where: {
      companyId_type: {
        companyId: upload.companyId,
        type: upload.type,
      },
    },
    select: {
      id: true,
      uploadId: true,
    },
  });

  if (!pointer || pointer.uploadId !== upload.id) {
    return false;
  }

  await prisma.companyActiveUpload.delete({
    where: {
      id: pointer.id,
    },
  });

  return true;
}

function serializeUpload(
  upload: UploadRow,
  pointer: ActivePointerRow | null,
  canManage: boolean,
) {
  const isPublished = Boolean(pointer && pointer.uploadId === upload.id);

  return {
    pointerId: isPublished && pointer ? pointer.id.toString() : undefined,
    uploadId: upload.id.toString(),
    incomeType: upload.type,
    incomeTypeLabel: INCOME_TYPE_LABELS[upload.type],
    fileName: upload.fileName,
    uploadedAt: upload.uploadedAt.toISOString(),
    publishedAt:
      isPublished && pointer ? pointer.updatedAt.toISOString() : undefined,
    companyVisible: isPublished,
    publishStatus: (isPublished ? "PUBLISHED" : "SAVED") as PublicationStatus,
    canManage,
  };
}

async function buildStatusSnapshot(
  companyId: bigint,
  organizationId: bigint,
  agentUserId: bigint,
) {
  const [uploads, pointers] = await Promise.all([
    prisma.upload.findMany({
      where: {
        companyId,
        company: {
          organizationLink: {
            is: {
              agentOrganizationId: organizationId,
            },
          },
        },
      },
      select: {
        id: true,
        companyId: true,
        type: true,
        fileName: true,
        uploadedAt: true,
        memo: true,
      },
      orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
      take: 300,
    }),
    prisma.companyActiveUpload.findMany({
      where: {
        companyId,
        company: {
          organizationLink: {
            is: {
              agentOrganizationId: organizationId,
            },
          },
        },
      },
      select: {
        id: true,
        type: true,
        uploadId: true,
        updatedAt: true,
      },
    }),
  ]);

  const pointerByType = new Map<SalaryIncomeType, ActivePointerRow>();
  for (const pointer of pointers) {
    pointerByType.set(pointer.type as SalaryIncomeType, {
      id: pointer.id,
      type: pointer.type as SalaryIncomeType,
      uploadId: pointer.uploadId,
      updatedAt: pointer.updatedAt,
    });
  }

  const list = uploads
    .map((upload) => {
      const canManage = canManageUpload(upload.memo, agentUserId);
      const pointer = pointerByType.get(upload.type as SalaryIncomeType) ?? null;
      const isPublished = Boolean(pointer && pointer.uploadId === upload.id);

      if (!canManage && !isPublished) {
        return null;
      }

      return serializeUpload(
        upload as UploadRow,
        isPublished ? pointer : null,
        canManage,
      );
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const latestSaved =
    list.find((item) => item.publishStatus === "SAVED" && item.canManage) ??
    null;

  const latestPublished =
    list.find((item) => item.publishStatus === "PUBLISHED" && item.canManage) ??
    null;

  return {
    uploads: list,
    latestSaved,
    latestPublished,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hasAccess = await ensureCompanyAccess(parsed.companyId, auth.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const snapshot = await buildStatusSnapshot(
      parsed.companyId,
      auth.organizationId,
      auth.userId,
    );

    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (error) {
    console.error("Agent salary publication GET error:", error);
    return NextResponse.json(
      { error: "발행 상태를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hasAccess = await ensureCompanyAccess(parsed.companyId, auth.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const action =
      body && typeof body.action === "string" ? body.action.trim() : "";

    if (action === "setUploadStatus") {
      const uploadIdRaw =
        body && typeof body.uploadId === "string" ? body.uploadId.trim() : "";
      const publishStatus =
        body && typeof body.publishStatus === "string"
          ? body.publishStatus.trim()
          : "";

      if (!uploadIdRaw) {
        return NextResponse.json(
          { error: "업로드 항목을 선택해주세요." },
          { status: 400 },
        );
      }

      if (publishStatus !== "SAVED" && publishStatus !== "PUBLISHED") {
        return NextResponse.json(
          { error: "변경할 상태가 올바르지 않습니다." },
          { status: 400 },
        );
      }

      const parsedUpload = parseUploadId(uploadIdRaw);
      if ("error" in parsedUpload) {
        return NextResponse.json({ error: parsedUpload.error }, { status: 400 });
      }

      const upload = await findUploadInCompany(
        parsed.companyId,
        auth.organizationId,
        parsedUpload.uploadId,
      );

      if (!upload) {
        return NextResponse.json(
          { error: "선택한 업로드를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      if (!canManageUpload(upload.memo, auth.userId)) {
        return NextResponse.json(
          { error: "해당 업로드를 저장한 에이전트만 상태를 변경할 수 있습니다." },
          { status: 403 },
        );
      }

      if (publishStatus === "PUBLISHED") {
        await publishUpload(
          auth.organizationId,
          auth.userId,
          parsedUpload.uploadId.toString(),
        );
      } else {
        await setUploadToSaved(upload as UploadRow);
      }

      const snapshot = await buildStatusSnapshot(
        parsed.companyId,
        auth.organizationId,
        auth.userId,
      );

      return NextResponse.json({
        success: true,
        action: "setUploadStatus",
        uploadId: parsedUpload.uploadId.toString(),
        publishStatus,
        ...snapshot,
      });
    }

    return NextResponse.json(
      { error: "올바른 액션이 아닙니다." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Agent salary publication POST error:", error);
    return NextResponse.json(
      { error: "발행 상태 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
