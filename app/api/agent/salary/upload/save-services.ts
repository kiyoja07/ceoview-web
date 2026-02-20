import prisma from "@/app/lib/prisma";
import type {
  EarnedIncomeOverrides,
  IncomeWithYmOverrides,
  UploadSaveResult,
} from "./types";
import {
  mapBusinessIncomeRow,
  mapEarnedIncomeRow,
  mapOtherIncomeLaborRow,
  mapOtherIncomeRow,
} from "./mappers";

async function loadBusinessEntity(businessEntityId: string) {
  const entity = await prisma.businessEntity.findUnique({
    where: { id: BigInt(businessEntityId) },
  });

  if (!entity) {
    throw new Error("사업자를 찾을 수 없습니다.");
  }

  return entity;
}

function filterBusinessOrOtherRows(rows: Record<string, unknown>[]) {
  return rows.filter((row) => {
    const code = String(row["코드"] ?? "").trim();
    const name = String(row["성   명"] ?? "").trim();
    if (!code || code === "합계" || name === "합계" || name === "계") {
      return false;
    }
    return true;
  });
}

function filterLaborRows(rows: Record<string, unknown>[]) {
  return rows.filter((row) => {
    const code = String(row["코드"] ?? "").trim();
    const name = String(row["성명"] ?? "").trim();
    if (!code || code === "합계" || name === "합계" || name === "계") {
      return false;
    }
    return true;
  });
}

function filterEarnedRows(rows: Record<string, unknown>[]) {
  return rows.filter((row) => {
    const code = String(row["사원코드"] ?? "").trim();
    const name = String(row["사원명"] ?? "").trim();
    if (!code || code === "합계" || name === "합계" || name === "계") {
      return false;
    }
    return true;
  });
}

export async function saveBusinessIncome(
  businessEntityId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: IncomeWithYmOverrides,
): Promise<UploadSaveResult> {
  const entity = await loadBusinessEntity(businessEntityId);
  const dataRows = filterBusinessOrOtherRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        businessEntity: { connect: { id: entity.id } },
        type: "BUSINESS_INCOME",
        fileName,
      },
    });

    const businessData = dataRows.map((row) =>
      mapBusinessIncomeRow(row, upload.id, overrides),
    );

    const created = await tx.businessIncome.createMany({
      data: businessData,
    });

    return {
      savedCount: created.count,
      uploadId: upload.id.toString(),
    };
  });
}

export async function saveOtherIncome(
  businessEntityId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: IncomeWithYmOverrides,
): Promise<UploadSaveResult> {
  const entity = await loadBusinessEntity(businessEntityId);
  const dataRows = filterBusinessOrOtherRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        businessEntity: { connect: { id: entity.id } },
        type: "OTHER_INCOME",
        fileName,
      },
    });

    const otherData = dataRows.map((row) =>
      mapOtherIncomeRow(row, upload.id, overrides),
    );

    const created = await tx.otherIncome.createMany({
      data: otherData,
    });

    return {
      savedCount: created.count,
      uploadId: upload.id.toString(),
    };
  });
}

export async function saveOtherIncomeLabor(
  businessEntityId: string,
  fileName: string,
  rows: Record<string, unknown>[],
): Promise<UploadSaveResult> {
  const entity = await loadBusinessEntity(businessEntityId);
  const dataRows = filterLaborRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        businessEntity: { connect: { id: entity.id } },
        type: "OTHER_INCOME_LABOR",
        fileName,
      },
    });

    const laborData = dataRows.map((row) => mapOtherIncomeLaborRow(row, upload.id));

    const created = await tx.dailyIncomeLabor.createMany({
      data: laborData,
    });

    return {
      savedCount: created.count,
      uploadId: upload.id.toString(),
    };
  });
}

export async function saveEarnedIncome(
  businessEntityId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: EarnedIncomeOverrides,
): Promise<UploadSaveResult> {
  const entity = await loadBusinessEntity(businessEntityId);
  const dataRows = filterEarnedRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        businessEntity: { connect: { id: entity.id } },
        type: "EARNED_INCOME",
        fileName,
      },
    });

    const earnedData = dataRows.map((row) =>
      mapEarnedIncomeRow(row, upload.id, overrides),
    );

    const created = await tx.earnedIncome.createMany({
      data: earnedData,
    });

    return {
      savedCount: created.count,
      uploadId: upload.id.toString(),
    };
  });
}
