import type { PrismaTx } from "@/app/lib/prisma";
import {
  COMPANY_ONBOARDING_PENDING_MARKER,
  createInternalPublicSlug,
  createPlaceholderBusinessNumber,
} from "@/app/lib/company-onboarding";

export type JoinRequestActorType = "agent" | "company";

export type JoinRequestCompany = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

export type JoinRequestUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

export const COMPANY_JOIN_REQUEST_STATUS = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const;

export async function createPendingCompany(tx: PrismaTx) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await tx.company.create({
        data: {
          businessNumber: createPlaceholderBusinessNumber(),
          businessType: "INDIVIDUAL",
          address: COMPANY_ONBOARDING_PENDING_MARKER,
          publicSlug: createInternalPublicSlug("pending-company"),
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("초기 사업장을 생성하지 못했습니다.");
}

export async function upsertPendingCompanyJoinRequest(
  tx: PrismaTx,
  params: {
    companyId: string;
    companyUserId: string;
    businessNumber: string;
  },
) {
  const now = new Date();
  return tx.companyJoinRequest.upsert({
    where: {
      companyId_companyUserId: {
        companyId: params.companyId,
        companyUserId: params.companyUserId,
      },
    },
    update: {
      businessNumber: params.businessNumber,
      status: COMPANY_JOIN_REQUEST_STATUS.pending,
      requestedAt: now,
      resolvedAt: null,
      resolvedByType: null,
      resolvedById: null,
    },
    create: {
      companyId: params.companyId,
      companyUserId: params.companyUserId,
      businessNumber: params.businessNumber,
      status: COMPANY_JOIN_REQUEST_STATUS.pending,
      requestedAt: now,
    },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      company: {
        select: {
          id: true,
          businessNumber: true,
          businessName: true,
        },
      },
    },
  });
}

export async function approveCompanyJoinRequest(
  tx: PrismaTx,
  params: {
    requestId: string;
    actorType: JoinRequestActorType;
    actorId: string;
  },
) {
  const now = new Date();
  const request = await tx.companyJoinRequest.findUnique({
    where: { id: params.requestId },
    select: {
      id: true,
      companyId: true,
      companyUserId: true,
      status: true,
      companyUser: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!request || request.status !== COMPANY_JOIN_REQUEST_STATUS.pending) {
    return null;
  }

  const updated = await tx.companyJoinRequest.updateMany({
    where: {
      id: request.id,
      status: COMPANY_JOIN_REQUEST_STATUS.pending,
    },
    data: {
      status: COMPANY_JOIN_REQUEST_STATUS.approved,
      resolvedAt: now,
      resolvedByType: params.actorType,
      resolvedById: params.actorId,
    },
  });

  if (updated.count !== 1) {
    return null;
  }

  const masterCount = await tx.companyUser.count({
    where: {
      companyId: request.companyId,
      isActive: true,
      isMaster: true,
    },
  });

  await tx.companyUser.update({
    where: { id: request.companyUserId },
    data: {
      companyId: request.companyId,
      isMaster: masterCount === 0,
    },
  });

  await tx.companyUserCompany.upsert({
    where: {
      companyUserId_companyId: {
        companyUserId: request.companyUserId,
        companyId: request.companyId,
      },
    },
    update: {},
    create: {
      companyUserId: request.companyUserId,
      companyId: request.companyId,
    },
  });

  const previousCompanyId = request.companyUser.companyId;
  if (previousCompanyId !== request.companyId) {
    await tx.companyUserCompany.deleteMany({
      where: {
        companyUserId: request.companyUserId,
        companyId: previousCompanyId,
      },
    });

    const [previousCompanyUserCount, previousCompanyMembershipCount] =
      await Promise.all([
        tx.companyUser.count({ where: { companyId: previousCompanyId } }),
        tx.companyUserCompany.count({ where: { companyId: previousCompanyId } }),
      ]);

    if (previousCompanyUserCount === 0 && previousCompanyMembershipCount === 0) {
      await tx.company.deleteMany({
        where: {
          id: previousCompanyId,
          address: COMPANY_ONBOARDING_PENDING_MARKER,
        },
      });
    }
  }

  return tx.companyJoinRequest.findUnique({
    where: { id: request.id },
    select: {
      id: true,
      status: true,
      companyId: true,
      companyUserId: true,
      resolvedAt: true,
    },
  });
}

export async function rejectCompanyJoinRequest(
  tx: PrismaTx,
  params: {
    requestId: string;
    actorType: JoinRequestActorType;
    actorId: string;
  },
) {
  const now = new Date();
  const updated = await tx.companyJoinRequest.updateMany({
    where: {
      id: params.requestId,
      status: COMPANY_JOIN_REQUEST_STATUS.pending,
    },
    data: {
      status: COMPANY_JOIN_REQUEST_STATUS.rejected,
      resolvedAt: now,
      resolvedByType: params.actorType,
      resolvedById: params.actorId,
    },
  });

  if (updated.count !== 1) {
    return null;
  }

  return tx.companyJoinRequest.findUnique({
    where: { id: params.requestId },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
    },
  });
}

export function serializeJoinRequest(request: {
  id: string;
  businessNumber: string;
  status: string;
  requestedAt: Date;
  resolvedAt: Date | null;
  company: JoinRequestCompany;
  companyUser: JoinRequestUser;
}) {
  return {
    id: request.id.toString(),
    businessNumber: request.businessNumber,
    status: request.status,
    requestedAt: request.requestedAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    company: {
      id: request.company.id.toString(),
      businessNumber: request.company.businessNumber,
      businessName: request.company.businessName,
    },
    companyUser: {
      id: request.companyUser.id.toString(),
      email: request.companyUser.email,
      name: request.companyUser.name,
      phone: request.companyUser.phone,
    },
  };
}
