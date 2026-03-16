import prisma from "@/app/lib/prisma";

const MAX_UNIQUE_RETRY = 50;

function buildDemoBusinessNumber(organizationId: bigint, attempt: number) {
  const space = BigInt(900_000_000); // 9자리 숫자 공간
  const base = organizationId % space;
  const candidate = (base + BigInt(attempt)) % space;
  return `9${candidate.toString().padStart(9, "0")}`; // 총 10자리
}

async function allocateBusinessNumber(
  tx: TransactionClient,
  organizationId: bigint,
) {
  for (let attempt = 0; attempt < MAX_UNIQUE_RETRY; attempt++) {
    const candidate = buildDemoBusinessNumber(organizationId, attempt);
    const exists = await tx.company.findUnique({
      where: { businessNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  throw new Error("데모 거래처 사업자번호를 생성하지 못했습니다.");
}

function slugBaseForOrganization(organizationId: bigint) {
  return `sample-${organizationId.toString()}`;
}

async function allocatePublicSlug(tx: TransactionClient, organizationId: bigint) {
  const base = slugBaseForOrganization(organizationId);
  for (let attempt = 0; attempt < MAX_UNIQUE_RETRY; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const exists = await tx.company.findUnique({
      where: { publicSlug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  throw new Error("데모 거래처 공개 슬러그를 생성하지 못했습니다.");
}

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function cloneCompanyDefinitions(
  tx: TransactionClient,
  sourceCompanyId: bigint,
  targetCompanyId: bigint,
) {
  const sourceDefinitions = await tx.earnedIncomeItemDefinition.findMany({
    where: { companyId: sourceCompanyId },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });

  const definitionIdMap = new Map<string, bigint>();

  for (const source of sourceDefinitions) {
    const {
      id: sourceId,
      companyId: sourceDefinitionCompanyId,
      ...definitionData
    } = source;
    void sourceId;
    void sourceDefinitionCompanyId;

    const created = await tx.earnedIncomeItemDefinition.create({
      data: {
        ...definitionData,
        companyId: targetCompanyId,
      },
      select: { id: true },
    });
    definitionIdMap.set(source.id.toString(), created.id);
  }

  return definitionIdMap;
}

async function cloneUploadRows(
  tx: TransactionClient,
  sourceUploadId: bigint,
  targetUploadId: bigint,
  uploadType: "EARNED_INCOME" | "BUSINESS_INCOME" | "OTHER_INCOME" | "OTHER_INCOME_LABOR",
  definitionIdMap: Map<string, bigint>,
) {
  if (uploadType === "EARNED_INCOME") {
    const sourceRows = await tx.earnedIncome.findMany({
      where: { uploadId: sourceUploadId },
      include: {
        itemValues: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    for (const sourceRow of sourceRows) {
      const {
        id: sourceRowId,
        uploadId: sourceRowUploadId,
        itemValues,
        ...earnedRowData
      } = sourceRow;
      void sourceRowId;
      void sourceRowUploadId;

      const itemValueCreates: Array<{
        amount: typeof sourceRow.itemValues[number]["amount"];
        createdAt: Date;
        updatedAt: Date;
        itemDefinitionId: bigint;
      }> = [];

      for (const sourceValue of itemValues) {
        const targetItemDefinitionId = definitionIdMap.get(
          sourceValue.itemDefinitionId.toString(),
        );
        if (!targetItemDefinitionId) continue;

        const {
          id: sourceValueId,
          earnedIncomeId: sourceValueEarnedIncomeId,
          itemDefinitionId: sourceValueItemDefinitionId,
          ...itemValueData
        } = sourceValue;
        void sourceValueId;
        void sourceValueEarnedIncomeId;
        void sourceValueItemDefinitionId;

        itemValueCreates.push({
          ...itemValueData,
          itemDefinitionId: targetItemDefinitionId,
        });
      }

      await tx.earnedIncome.create({
        data: {
          ...earnedRowData,
          uploadId: targetUploadId,
          itemValues:
            itemValueCreates.length > 0
              ? {
                  create: itemValueCreates,
                }
              : undefined,
        },
      });
    }
    return;
  }

  if (uploadType === "BUSINESS_INCOME") {
    const sourceRows = await tx.businessIncome.findMany({
      where: { uploadId: sourceUploadId },
      orderBy: { id: "asc" },
    });

    if (sourceRows.length === 0) return;

    await tx.businessIncome.createMany({
      data: sourceRows.map((row) => {
        const { id: sourceRowId, uploadId: sourceUploadId, ...rowData } = row;
        void sourceRowId;
        void sourceUploadId;
        return {
          ...rowData,
          uploadId: targetUploadId,
        };
      }),
    });
    return;
  }

  if (uploadType === "OTHER_INCOME") {
    const sourceRows = await tx.otherIncome.findMany({
      where: { uploadId: sourceUploadId },
      orderBy: { id: "asc" },
    });

    if (sourceRows.length === 0) return;

    await tx.otherIncome.createMany({
      data: sourceRows.map((row) => {
        const { id: sourceRowId, uploadId: sourceUploadId, ...rowData } = row;
        void sourceRowId;
        void sourceUploadId;
        return {
          ...rowData,
          uploadId: targetUploadId,
        };
      }),
    });
    return;
  }

  const sourceRows = await tx.dailyIncomeLabor.findMany({
    where: { uploadId: sourceUploadId },
    orderBy: { id: "asc" },
  });

  if (sourceRows.length === 0) return;

  await tx.dailyIncomeLabor.createMany({
    data: sourceRows.map((row) => {
      const { id: sourceRowId, uploadId: sourceUploadId, ...rowData } = row;
      void sourceRowId;
      void sourceUploadId;
      return {
        ...rowData,
        uploadId: targetUploadId,
      };
    }),
  });
}

async function cloneCompanyUploads(
  tx: TransactionClient,
  sourceCompanyId: bigint,
  targetCompanyId: bigint,
  definitionIdMap: Map<string, bigint>,
) {
  const sourceUploads = await tx.upload.findMany({
    where: { companyId: sourceCompanyId },
    orderBy: [{ uploadedAt: "asc" }, { id: "asc" }],
  });

  const uploadIdMap = new Map<string, bigint>();

  for (const sourceUpload of sourceUploads) {
    const {
      id: sourceUploadId,
      companyId: sourceUploadCompanyId,
      ...uploadData
    } = sourceUpload;
    void sourceUploadId;
    void sourceUploadCompanyId;

    const createdUpload = await tx.upload.create({
      data: {
        ...uploadData,
        companyId: targetCompanyId,
      },
      select: { id: true },
    });

    uploadIdMap.set(sourceUpload.id.toString(), createdUpload.id);

    await cloneUploadRows(
      tx,
      sourceUpload.id,
      createdUpload.id,
      sourceUpload.type,
      definitionIdMap,
    );
  }

  const sourceActiveUploads = await tx.companyActiveUpload.findMany({
    where: { companyId: sourceCompanyId },
    orderBy: { id: "asc" },
  });

  for (const sourceActive of sourceActiveUploads) {
    const targetUploadId = uploadIdMap.get(sourceActive.uploadId.toString());
    if (!targetUploadId) continue;

    await tx.companyActiveUpload.create({
      data: {
        companyId: targetCompanyId,
        type: sourceActive.type,
        uploadId: targetUploadId,
      },
    });
  }
}

async function promoteDemoToPublicShowcase(
  tx: TransactionClient,
  companyId: bigint,
  organizationId: bigint,
) {
  const existing = await tx.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      isDemo: true,
      isPublicShowcase: true,
      publicSlug: true,
    },
  });

  if (!existing || !existing.isDemo) return;
  if (existing.isPublicShowcase && existing.publicSlug) return;

  const publicSlug = existing.publicSlug ?? (await allocatePublicSlug(tx, organizationId));

  await tx.company.update({
    where: { id: companyId },
    data: {
      isPublicShowcase: true,
      publicSlug,
    },
  });
}

function buildDemoBusinessName(sourceName: string | null) {
  const baseName = sourceName?.trim() || "샘플 거래처";
  if (baseName.includes("데모")) return baseName;
  return `${baseName} 데모`;
}

export type EnsureDemoCompanyResult = {
  companyId: bigint;
  created: boolean;
  publicSlug: string | null;
};

export async function ensureDemoCompanyForOrganization(
  organizationId: bigint,
): Promise<EnsureDemoCompanyResult | null> {
  return prisma.$transaction(async (tx) => {
    const existingDemo = await tx.company.findFirst({
      where: {
        isDemo: true,
        organizationLink: {
          is: {
            agentOrganizationId: organizationId,
          },
        },
      },
      select: {
        id: true,
        publicSlug: true,
      },
    });

    if (existingDemo) {
      await promoteDemoToPublicShowcase(tx, existingDemo.id, organizationId);

      const refreshed = await tx.company.findUnique({
        where: { id: existingDemo.id },
        select: { publicSlug: true },
      });

      return {
        companyId: existingDemo.id,
        created: false,
        publicSlug: refreshed?.publicSlug ?? null,
      };
    }

    const templateCompany =
      (await tx.company.findFirst({
        where: {
          isDemo: false,
          uploads: { some: {} },
        },
        orderBy: [{ isPublicShowcase: "desc" }, { id: "asc" }],
        select: {
          id: true,
          businessType: true,
          businessName: true,
          representativeName: true,
          openingDate: true,
          address: true,
        },
      })) ??
      (await tx.company.findFirst({
        where: {
          uploads: { some: {} },
        },
        orderBy: { id: "asc" },
        select: {
          id: true,
          businessType: true,
          businessName: true,
          representativeName: true,
          openingDate: true,
          address: true,
        },
      }));

    if (!templateCompany) return null;

    const businessNumber = await allocateBusinessNumber(tx, organizationId);
    const publicSlug = await allocatePublicSlug(tx, organizationId);

    const createdCompany = await tx.company.create({
      data: {
        businessNumber,
        businessType: templateCompany.businessType,
        businessName: buildDemoBusinessName(templateCompany.businessName),
        representativeName: templateCompany.representativeName,
        openingDate: templateCompany.openingDate,
        address: templateCompany.address,
        isDemo: true,
        isPublicShowcase: true,
        publicSlug,
      },
      select: { id: true },
    });

    await tx.agentOrganizationCompany.create({
      data: {
        agentOrganizationId: organizationId,
        companyId: createdCompany.id,
      },
    });

    const definitionIdMap = await cloneCompanyDefinitions(
      tx,
      templateCompany.id,
      createdCompany.id,
    );

    await cloneCompanyUploads(
      tx,
      templateCompany.id,
      createdCompany.id,
      definitionIdMap,
    );

    return {
      companyId: createdCompany.id,
      created: true,
      publicSlug,
    };
  });
}
