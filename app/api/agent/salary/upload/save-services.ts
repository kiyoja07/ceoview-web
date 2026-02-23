import prisma from "@/app/lib/prisma";
import {
  EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT,
  EARNED_ITEM_NAME_STUDENT_LOAN_REPAYMENT,
  EARNED_ITEM_CODE_HEALTH_INS_UNPAID_Q1,
  EARNED_ITEM_NAME_HEALTH_INS_UNPAID_Q1,
} from "@/app/lib/payroll-items";
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

async function loadCompany(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: BigInt(companyId) },
  });

  if (!company) {
    throw new Error("사업자를 찾을 수 없습니다.");
  }

  return company;
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
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: IncomeWithYmOverrides,
): Promise<UploadSaveResult> {
  const company = await loadCompany(companyId);
  const dataRows = filterBusinessOrOtherRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        company: { connect: { id: company.id } },
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
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: IncomeWithYmOverrides,
): Promise<UploadSaveResult> {
  const company = await loadCompany(companyId);
  const dataRows = filterBusinessOrOtherRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        company: { connect: { id: company.id } },
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
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
): Promise<UploadSaveResult> {
  const company = await loadCompany(companyId);
  const dataRows = filterLaborRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        company: { connect: { id: company.id } },
        type: "OTHER_INCOME_LABOR",
        fileName,
      },
    });

    const laborData = dataRows.map((row) =>
      mapOtherIncomeLaborRow(row, upload.id),
    );

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
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: EarnedIncomeOverrides,
): Promise<UploadSaveResult> {
  const company = await loadCompany(companyId);
  const dataRows = filterEarnedRows(rows);

  if (dataRows.length === 0) {
    throw new Error("저장할 데이터 행이 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const upload = await tx.upload.create({
      data: {
        company: { connect: { id: company.id } },
        type: "EARNED_INCOME",
        fileName,
      },
    });

    const earnedRows = dataRows.map((row) =>
      mapEarnedIncomeRow(row, upload.id, overrides),
    );

    // Upsert all dynamic item definitions
    const dynamicDefs = [
      {
        code: EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT,
        name: EARNED_ITEM_NAME_STUDENT_LOAN_REPAYMENT,
        kind: "DEDUCTION" as const,
      },
      {
        code: EARNED_ITEM_CODE_HEALTH_INS_UNPAID_Q1,
        name: EARNED_ITEM_NAME_HEALTH_INS_UNPAID_Q1,
        kind: "DEDUCTION" as const,
      },
    ];

    const defMap = new Map<string, bigint>();
    for (const def of dynamicDefs) {
      const defRecord = await tx.earnedIncomeItemDefinition.upsert({
        where: {
          companyId_code: {
            companyId: company.id,
            code: def.code,
          },
        },
        update: {
          name: def.name,
          kind: def.kind,
          active: true,
        },
        create: {
          companyId: company.id,
          code: def.code,
          name: def.name,
          kind: def.kind,
        },
        select: { id: true },
      });
      defMap.set(def.code, defRecord.id);
    }

    let savedCount = 0;
    for (const mapped of earnedRows) {
      const earnedIncome = await tx.earnedIncome.create({
        data: mapped.earnedIncomeData,
        select: { id: true },
      });
      savedCount += 1;

      for (const item of mapped.dynamicItems) {
        const defId = defMap.get(item.code);
        if (!defId) continue;

        await tx.earnedIncomeItemValue.create({
          data: {
            earnedIncomeId: earnedIncome.id,
            itemDefinitionId: defId,
            amount: item.amount,
          },
        });
      }
    }

    return {
      savedCount,
      uploadId: upload.id.toString(),
    };
  });
}
