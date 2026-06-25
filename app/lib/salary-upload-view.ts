import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

const UPLOAD_META_PREFIX = "__upload_meta__:";

export type SalaryUploadType =
  | "EARNED_INCOME"
  | "BUSINESS_INCOME"
  | "OTHER_INCOME"
  | "OTHER_INCOME_LABOR";

export type PublicationStatus = "NONE" | "SAVED" | "PUBLISHED";

export type UploadViewSelection = {
  uploadId: string | null;
  uploadedAt: Date | null;
  publishStatus: PublicationStatus;
  isAgentView: boolean;
  companyVisible: boolean;
};

function parseUploadedByAgentUserId(memo: string | null): string | null {
  if (!memo || !memo.startsWith(UPLOAD_META_PREFIX)) return null;

  const jsonPart = memo.slice(UPLOAD_META_PREFIX.length);
  try {
    const parsed = JSON.parse(jsonPart) as { uploadedByAgentUserId?: string };
    if (!parsed.uploadedByAgentUserId) return null;
    return parsed.uploadedByAgentUserId;
  } catch {
    return null;
  }
}

function canViewSavedUpload(memo: string | null, agentUserId: string) {
  const uploadedBy = parseUploadedByAgentUserId(memo);
  if (!uploadedBy) return true;
  return uploadedBy === agentUserId;
}

export function serializeUploadViewSelection(selection: UploadViewSelection) {
  return {
    publishStatus: selection.publishStatus,
    isAgentView: selection.isAgentView,
    companyVisible: selection.companyVisible,
    uploadedAt: selection.uploadedAt ? selection.uploadedAt.toISOString() : null,
  };
}

async function getPublishedSelection(
  companyId: string,
  type: SalaryUploadType,
  isAgentView: boolean,
): Promise<UploadViewSelection> {
  const activePointer = await prisma.companyActiveUpload.findUnique({
    where: {
      companyId_type: {
        companyId,
        type,
      },
    },
    select: {
      uploadId: true,
      upload: {
        select: {
          uploadedAt: true,
        },
      },
    },
  });

  if (!activePointer) {
    return {
      uploadId: null,
      uploadedAt: null,
      publishStatus: "NONE",
      isAgentView,
      companyVisible: false,
    };
  }

  return {
    uploadId: activePointer.uploadId,
    uploadedAt: activePointer.upload.uploadedAt,
    publishStatus: "PUBLISHED",
    isAgentView,
    companyVisible: true,
  };
}

export async function resolveUploadForCompanyView(
  request: NextRequest,
  companyId: string,
  type: SalaryUploadType,
): Promise<UploadViewSelection> {
  const agentUserId = getAgentUserIdFromRequest(request);

  if (!agentUserId) {
    return getPublishedSelection(companyId, type, false);
  }

  const [agentUser, activePointer] = await Promise.all([
    prisma.agentUser.findUnique({
      where: { id: agentUserId },
      select: { isActive: true, agentOrganizationId: true },
    }),
    prisma.companyActiveUpload.findUnique({
      where: {
        companyId_type: {
          companyId,
          type,
        },
      },
      select: {
        uploadId: true,
        upload: {
          select: {
            uploadedAt: true,
          },
        },
      },
    }),
  ]);

  if (!agentUser || !agentUser.isActive || !agentUser.agentOrganizationId) {
    return getPublishedSelection(companyId, type, false);
  }

  const companyLink = await prisma.agentOrganizationCompany.findUnique({
    where: {
      agentOrganizationId_companyId: {
        agentOrganizationId: agentUser.agentOrganizationId,
        companyId,
      },
    },
    select: { id: true },
  });

  if (!companyLink) {
    return getPublishedSelection(companyId, type, false);
  }

  const latestUploads = await prisma.upload.findMany({
    where: {
      companyId,
      type,
    },
    select: {
      id: true,
      uploadedAt: true,
      memo: true,
    },
    orderBy: [{ uploadedAt: "desc" }, { id: "desc" }],
    take: 200,
  });

  for (const upload of latestUploads) {
    const isPublished = activePointer?.uploadId === upload.id;

    if (isPublished) {
      return {
        uploadId: upload.id,
        uploadedAt: upload.uploadedAt,
        publishStatus: "PUBLISHED",
        isAgentView: true,
        companyVisible: true,
      };
    }

    if (canViewSavedUpload(upload.memo, agentUserId)) {
      return {
        uploadId: upload.id,
        uploadedAt: upload.uploadedAt,
        publishStatus: "SAVED",
        isAgentView: true,
        companyVisible: false,
      };
    }
  }

  if (activePointer) {
    return {
      uploadId: activePointer.uploadId,
      uploadedAt: activePointer.upload.uploadedAt,
      publishStatus: "PUBLISHED",
      isAgentView: true,
      companyVisible: true,
    };
  }

  return {
    uploadId: null,
    uploadedAt: null,
    publishStatus: "NONE",
    isAgentView: true,
    companyVisible: false,
  };
}
