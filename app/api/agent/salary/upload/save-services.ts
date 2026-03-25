import prisma, { type PrismaTx } from "@/app/lib/prisma";
import {
  EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT,
  EARNED_ITEM_NAME_STUDENT_LOAN_REPAYMENT,
  EARNED_ITEM_CODE_HEALTH_INS_UNPAID_Q1,
  EARNED_ITEM_NAME_HEALTH_INS_UNPAID_Q1,
} from "@/app/lib/payroll-items";
import type {
  EarnedIncomeOverrides,
  IncomeWithYmOverrides,
  SalaryIncomeType,
  UploadSaveResult,
} from "./types";
import {
  mapBusinessIncomeRow,
  mapEarnedIncomeRow,
  mapOtherIncomeLaborRow,
  mapOtherIncomeRow,
} from "./mappers";

const UPLOAD_META_PREFIX = "__upload_meta__:";

function buildUploadMemo(agentUserId: bigint) {
  return `${UPLOAD_META_PREFIX}${JSON.stringify({
    uploadedByAgentUserId: agentUserId.toString(),
  })}`;
}

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

async function loadCompany(organizationId: bigint, companyId: string) {
  let parsedCompanyId: bigint;
  try {
    parsedCompanyId = BigInt(companyId);
  } catch {
    throw new Error("유효한 사업자 ID가 아닙니다.");
  }

  const company = await prisma.company.findFirst({
    where: {
      id: parsedCompanyId,
      organizationLink: {
        is: {
          agentOrganizationId: organizationId,
        },
      },
    },
  });

  if (!company) {
    throw new Error("접근 가능한 사업자를 찾을 수 없습니다.");
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

async function loadEmployeeIdByCode(companyId: bigint, tx: PrismaTx) {
  const employees = await tx.employee.findMany({
    where: {
      companyId,
      deletedAt: null,
      employeeCode: { not: null },
    },
    select: {
      id: true,
      employeeCode: true,
    },
  });

  return new Map(
    employees
      .filter((employee): employee is { id: bigint; employeeCode: string } =>
        Boolean(employee.employeeCode),
      )
      .map((employee) => [employee.employeeCode.trim(), employee.id] as const),
  );
}

export async function publishUpload(
  organizationId: bigint,
  agentUserId: bigint,
  uploadId: string,
) {
  let parsedUploadId: bigint;
  try {
    parsedUploadId = BigInt(uploadId);
  } catch {
    throw new Error("유효한 업로드 ID가 아닙니다.");
  }

  const upload = await prisma.upload.findFirst({
    where: {
      id: parsedUploadId,
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
      memo: true,
    },
  });

  if (!upload) {
    throw new Error("발행할 업로드를 찾을 수 없습니다.");
  }

  const uploadedByAgentUserId = parseUploadedByAgentUserId(upload.memo);
  if (uploadedByAgentUserId && uploadedByAgentUserId !== agentUserId) {
    throw new Error("해당 업로드를 저장한 에이전트만 발행할 수 있습니다.");
  }

  await prisma.companyActiveUpload.upsert({
    where: {
      companyId_type: {
        companyId: upload.companyId,
        type: upload.type,
      },
    },
    update: {
      uploadId: upload.id,
    },
    create: {
      companyId: upload.companyId,
      type: upload.type,
      uploadId: upload.id,
    },
  });

  return {
    uploadId: upload.id.toString(),
    companyId: upload.companyId.toString(),
    incomeType: upload.type as SalaryIncomeType,
    publishStatus: "PUBLISHED" as const,
  };
}

export async function saveBusinessIncome(
  organizationId: bigint,
  agentUserId: bigint,
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: IncomeWithYmOverrides,
): Promise<UploadSaveResult> {
  const company = await loadCompany(organizationId, companyId);
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
        memo: buildUploadMemo(agentUserId),
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
      publishStatus: "SAVED",
    };
  });
}

export async function saveOtherIncome(
  organizationId: bigint,
  agentUserId: bigint,
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: IncomeWithYmOverrides,
): Promise<UploadSaveResult> {
  const company = await loadCompany(organizationId, companyId);
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
        memo: buildUploadMemo(agentUserId),
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
      publishStatus: "SAVED",
    };
  });
}

export async function saveOtherIncomeLabor(
  organizationId: bigint,
  agentUserId: bigint,
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
): Promise<UploadSaveResult> {
  const company = await loadCompany(organizationId, companyId);
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
        memo: buildUploadMemo(agentUserId),
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
      publishStatus: "SAVED",
    };
  });
}

export async function saveEarnedIncome(
  organizationId: bigint,
  agentUserId: bigint,
  companyId: string,
  fileName: string,
  rows: Record<string, unknown>[],
  overrides: EarnedIncomeOverrides,
): Promise<UploadSaveResult> {
  const company = await loadCompany(organizationId, companyId);
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
        memo: buildUploadMemo(agentUserId),
      },
    });

    const employeeIdByCode = await loadEmployeeIdByCode(company.id, tx);
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
      const resolvedEmployeeId = employeeIdByCode.get(
        mapped.earnedIncomeData.employeeCode.trim(),
      );
      const earnedIncome = await tx.earnedIncome.create({
        data: {
          ...mapped.earnedIncomeData,
          employeeId: resolvedEmployeeId,
        },
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
      publishStatus: "SAVED",
    };
  });
}
