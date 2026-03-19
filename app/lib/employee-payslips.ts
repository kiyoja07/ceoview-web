import type { PayslipData } from "@/app/company/[id]/salary/lib/payslip-template";
import { toPayslipData } from "@/app/company/[id]/salary/lib/payslip-template";
import type {
  BusinessIncomeRow,
  Company,
  DailyIncomeLaborRow,
  OtherIncomeRow,
} from "@/app/company/[id]/salary/types";
import prisma from "@/app/lib/prisma";
import {
  buildEarnedPayslipData,
  formatPayslipYm,
} from "@/app/lib/payslip-earned";
import type { EmployeePortalSession } from "@/app/lib/employee-portal";

export type EmployeePayslipType = "earned" | "business" | "other" | "daily";

export type EmployeePayslipEntry = {
  id: string;
  type: EmployeePayslipType;
  incomeLabel: string;
  monthKey: string | null;
  monthLabel: string;
  metaLabel: string;
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  payslipData: PayslipData;
};

export type EmployeePayslipMonthGroup = {
  monthKey: string;
  monthLabel: string;
  entries: EmployeePayslipEntry[];
};

export type EmployeePayslipCollection = {
  monthGroups: EmployeePayslipMonthGroup[];
  undatedEntries: EmployeePayslipEntry[];
  allEntries: EmployeePayslipEntry[];
};

const ACTIVE_UPLOAD_TYPES = [
  "EARNED_INCOME",
  "BUSINESS_INCOME",
  "OTHER_INCOME",
  "OTHER_INCOME_LABOR",
] as const;

const TYPE_LABELS: Record<EmployeePayslipType, string> = {
  earned: "근로소득",
  business: "사업소득",
  other: "기타소득",
  daily: "일용직소득",
};

const TYPE_SORT_ORDER: Record<EmployeePayslipType, number> = {
  earned: 0,
  business: 1,
  other: 2,
  daily: 3,
};

function normalizeResidentNumber(value: string | null | undefined) {
  const digits = value?.replace(/[\s-]/g, "").trim() ?? "";
  return digits.length > 0 ? digits : null;
}

function getSingleEmployeeCode(
  rows: Array<{ employeeCode: string | null; residentNumber: string | null }>,
  residentNumber: string,
  logLabel: string,
  employeeId: bigint,
) {
  const employeeCodes = [
    ...new Set(
      rows
        .filter(
          (row) => normalizeResidentNumber(row.residentNumber) === residentNumber,
        )
        .map((row) => row.employeeCode?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  if (employeeCodes.length > 1) {
    console.warn(
      `[employee-payslips] residentNumber conflict for ${logLabel} employeeId=${employeeId.toString()}`,
      employeeCodes,
    );
    return null;
  }

  return employeeCodes[0] ?? null;
}

function buildMonthKey(paymentYm: number) {
  return formatPayslipYm(paymentYm);
}

function buildCompany(session: EmployeePortalSession): Company {
  return {
    id: session.employee.company.id.toString(),
    businessName: session.employee.company.businessName,
    businessNumber: session.employee.company.businessNumber,
  };
}

function sortEntries(entries: EmployeePayslipEntry[]) {
  return [...entries].sort((left, right) => {
    const byType = TYPE_SORT_ORDER[left.type] - TYPE_SORT_ORDER[right.type];
    if (byType !== 0) return byType;
    return right.netPayment - left.netPayment;
  });
}

async function backfillEarnedIncomeEmployeeId(params: {
  uploadId: bigint;
  employeeId: bigint;
  employeeCode: string | null;
}) {
  if (!params.employeeCode?.trim()) {
    return;
  }

  await prisma.earnedIncome.updateMany({
    where: {
      uploadId: params.uploadId,
      employeeId: null,
      employeeCode: params.employeeCode.trim(),
    },
    data: {
      employeeId: params.employeeId,
    },
  });
}

export async function getEmployeePayslipCollection(
  session: EmployeePortalSession,
): Promise<EmployeePayslipCollection> {
  const companyId = session.employee.company.id;
  const company = buildCompany(session);
  const normalizedResident = normalizeResidentNumber(
    session.employee.residentNumber,
  );

  const activeUploads = await prisma.companyActiveUpload.findMany({
    where: {
      companyId,
      type: {
        in: [...ACTIVE_UPLOAD_TYPES],
      },
    },
    select: {
      type: true,
      uploadId: true,
    },
  });

  const uploadIdByType = new Map(
    activeUploads.map((row) => [row.type, row.uploadId] as const),
  );
  const earnedUploadId = uploadIdByType.get("EARNED_INCOME");
  const businessUploadId = uploadIdByType.get("BUSINESS_INCOME");
  const otherUploadId = uploadIdByType.get("OTHER_INCOME");
  const dailyUploadId = uploadIdByType.get("OTHER_INCOME_LABOR");

  const [
    businessEmployeeRows,
    otherEmployeeRows,
    dailyEmployeeRows,
  ] = normalizedResident
    ? await Promise.all([
        prisma.businessIncomeEmployee.findMany({
          where: {
            companyId,
            deletedAt: null,
            publishStatus: "PUBLISHED",
            residentNumber: { not: null },
          },
          select: {
            employeeCode: true,
            residentNumber: true,
          },
        }),
        prisma.otherIncomeEmployee.findMany({
          where: {
            companyId,
            deletedAt: null,
            publishStatus: "PUBLISHED",
            residentNumber: { not: null },
          },
          select: {
            employeeCode: true,
            residentNumber: true,
          },
        }),
        prisma.otherIncomeLaborEmployee.findMany({
          where: {
            companyId,
            deletedAt: null,
            publishStatus: "PUBLISHED",
            residentNumber: { not: null },
          },
          select: {
            employeeCode: true,
            residentNumber: true,
          },
        }),
      ])
    : [[], [], []];

  const businessEmployeeCode = normalizedResident
    ? getSingleEmployeeCode(
        businessEmployeeRows,
        normalizedResident,
        "business",
        session.employeeId,
      )
    : null;
  const otherEmployeeCode = normalizedResident
    ? getSingleEmployeeCode(
        otherEmployeeRows,
        normalizedResident,
        "other",
        session.employeeId,
      )
    : null;
  const dailyEmployeeCode = normalizedResident
    ? getSingleEmployeeCode(
        dailyEmployeeRows,
        normalizedResident,
        "daily",
        session.employeeId,
      )
    : null;

  if (earnedUploadId) {
    await backfillEarnedIncomeEmployeeId({
      uploadId: earnedUploadId,
      employeeId: session.employeeId,
      employeeCode: session.employee.employeeCode,
    });
  }

  const [
    earnedRows,
    businessRows,
    otherRows,
    dailyRows,
  ] = await Promise.all([
    earnedUploadId
      ? prisma.earnedIncome.findMany({
          where: {
            uploadId: earnedUploadId,
            employeeId: session.employeeId,
          },
          include: {
            itemValues: {
              include: {
                itemDefinition: {
                  select: {
                    name: true,
                    kind: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { paymentYm: "desc" },
            { accrualYm: "desc" },
            { payDate: "desc" },
            { id: "desc" },
          ],
        })
      : Promise.resolve([] as Awaited<
          ReturnType<typeof prisma.earnedIncome.findMany>
        >),
    businessUploadId && businessEmployeeCode
      ? prisma.businessIncome.findMany({
          where: {
            uploadId: businessUploadId,
            employeeCode: businessEmployeeCode,
          },
          orderBy: [
            { paymentYm: "desc" },
            { accrualYm: "desc" },
            { id: "desc" },
          ],
        })
      : Promise.resolve([] as Awaited<
          ReturnType<typeof prisma.businessIncome.findMany>
        >),
    otherUploadId && otherEmployeeCode
      ? prisma.otherIncome.findMany({
          where: {
            uploadId: otherUploadId,
            employeeCode: otherEmployeeCode,
          },
          orderBy: [
            { paymentYm: "desc" },
            { accrualYm: "desc" },
            { id: "desc" },
          ],
        })
      : Promise.resolve([] as Awaited<
          ReturnType<typeof prisma.otherIncome.findMany>
        >),
    dailyUploadId && dailyEmployeeCode
      ? prisma.dailyIncomeLabor.findMany({
          where: {
            uploadId: dailyUploadId,
            employeeCode: dailyEmployeeCode,
          },
          orderBy: [{ id: "desc" }],
        })
      : Promise.resolve([] as Awaited<
          ReturnType<typeof prisma.dailyIncomeLabor.findMany>
        >),
  ]);

  const earnedEntries: EmployeePayslipEntry[] = earnedRows.map((row) => {
    const monthKey = buildMonthKey(row.paymentYm);
    const payslipData = buildEarnedPayslipData(row, {
      businessName: company.businessName,
      businessNumber: company.businessNumber,
    });

    return {
      id: row.id.toString(),
      type: "earned",
      incomeLabel: TYPE_LABELS.earned,
      monthKey,
      monthLabel: monthKey,
      metaLabel: `귀속 ${formatPayslipYm(row.accrualYm)} · 지급 ${monthKey}`,
      totalPayment: Number(row.totalPayment),
      totalDeduction: Number(row.totalDeduction),
      netPayment: Number(row.netPayment),
      payslipData,
    };
  });

  const businessEntries: EmployeePayslipEntry[] = businessRows.map((row) => {
    const monthKey = buildMonthKey(row.paymentYm);
    const businessRow: BusinessIncomeRow = {
      id: row.id.toString(),
      accrualYm: row.accrualYm,
      paymentYm: row.paymentYm,
      employeeCode: row.employeeCode,
      employeeName: row.employeeName,
      grossPayment: row.grossPayment.toString(),
      incomeTax: row.incomeTax.toString(),
      localIncomeTax: row.localIncomeTax.toString(),
      expenseArtSpec: row.expenseArtSpec.toString(),
      employmentIns: row.employmentIns.toString(),
      studentLoan: row.studentLoan.toString(),
      industrialAcc: row.industrialAcc.toString(),
      netPayment: row.netPayment.toString(),
    };

    return {
      id: row.id.toString(),
      type: "business",
      incomeLabel: TYPE_LABELS.business,
      monthKey,
      monthLabel: monthKey,
      metaLabel: `귀속 ${formatPayslipYm(row.accrualYm)} · 지급 ${monthKey}`,
      totalPayment: Number(row.grossPayment),
      totalDeduction:
        Number(row.incomeTax) +
        Number(row.localIncomeTax) +
        Number(row.expenseArtSpec) +
        Number(row.employmentIns) +
        Number(row.studentLoan) +
        Number(row.industrialAcc),
      netPayment: Number(row.netPayment),
      payslipData: toPayslipData(businessRow, "business", company),
    };
  });

  const otherEntries: EmployeePayslipEntry[] = otherRows.map((row) => {
    const monthKey = buildMonthKey(row.paymentYm);
    const otherRow: OtherIncomeRow = {
      id: row.id.toString(),
      accrualYm: row.accrualYm,
      paymentYm: row.paymentYm,
      employeeCode: row.employeeCode,
      employeeName: row.employeeName,
      incomeType: row.incomeType,
      grossPayment: row.grossPayment.toString(),
      taxCorpTax: row.taxCorpTax.toString(),
      localIncomeTax: row.localIncomeTax.toString(),
      netPayment: row.netPayment.toString(),
    };

    return {
      id: row.id.toString(),
      type: "other",
      incomeLabel: TYPE_LABELS.other,
      monthKey,
      monthLabel: monthKey,
      metaLabel: `귀속 ${formatPayslipYm(row.accrualYm)} · 지급 ${monthKey}`,
      totalPayment: Number(row.grossPayment),
      totalDeduction: Number(row.taxCorpTax) + Number(row.localIncomeTax),
      netPayment: Number(row.netPayment),
      payslipData: toPayslipData(otherRow, "other", company),
    };
  });

  const dailyEntries: EmployeePayslipEntry[] = dailyRows.map((row) => {
    const dailyRow: DailyIncomeLaborRow = {
      id: row.id.toString(),
      employeeCode: row.employeeCode,
      employeeName: row.employeeName,
      jobType: row.jobType,
      position: row.position,
      identificationNumber: row.identificationNumber,
      address: row.address,
      phone: row.phone,
      joinDate: row.joinDate?.toISOString() ?? null,
      workDays: row.workDays,
      normalHours: row.normalHours?.toString() ?? null,
      overtimeHours: row.overtimeHours?.toString() ?? null,
      grossPay: row.grossPay.toString(),
      employmentIns: row.employmentIns.toString(),
      nationalPension: row.nationalPension.toString(),
      healthIns: row.healthIns.toString(),
      incomeTax: row.incomeTax.toString(),
      localIncomeTax: row.localIncomeTax.toString(),
      longTermCare: row.longTermCare.toString(),
      netPay: row.netPay.toString(),
    };

    return {
      id: row.id.toString(),
      type: "daily",
      incomeLabel: TYPE_LABELS.daily,
      monthKey: null,
      monthLabel: "월 정보 없음",
      metaLabel:
        row.workDays != null ? `근무일수 ${row.workDays}일` : "월 정보 없음",
      totalPayment: Number(row.grossPay),
      totalDeduction:
        Number(row.employmentIns) +
        Number(row.nationalPension) +
        Number(row.healthIns) +
        Number(row.incomeTax) +
        Number(row.localIncomeTax) +
        Number(row.longTermCare),
      netPayment: Number(row.netPay),
      payslipData: toPayslipData(dailyRow, "daily", company),
    };
  });

  const monthlyEntryMap = new Map<string, EmployeePayslipEntry[]>();
  for (const entry of [...earnedEntries, ...businessEntries, ...otherEntries]) {
    const list = monthlyEntryMap.get(entry.monthKey!) ?? [];
    list.push(entry);
    monthlyEntryMap.set(entry.monthKey!, list);
  }

  const monthGroups = [...monthlyEntryMap.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([monthKey, entries]) => ({
      monthKey,
      monthLabel: monthKey,
      entries: sortEntries(entries),
    }));

  const undatedEntries = sortEntries(dailyEntries);
  const allEntries = [...monthGroups.flatMap((group) => group.entries), ...undatedEntries];

  return {
    monthGroups,
    undatedEntries,
    allEntries,
  };
}
