import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { INCOME_TYPE_LABELS } from "@/app/api/agent/salary/upload/constants";
import type { SalaryIncomeType } from "@/app/api/agent/salary/upload/types";

const UPLOAD_META_PREFIX = "__upload_meta__:";
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 300;

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

function canManageUpload(memo: string | null, agentUserId: string) {
  const uploadedByAgentUserId = parseUploadedByAgentUserId(memo);
  if (uploadedByAgentUserId == null) return true;
  return uploadedByAgentUserId === agentUserId;
}

function parseObjectIdOrNull(value: string) {
  return value || null;
}

function parseLimit(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;
  const normalized = Math.floor(raw);
  if (normalized <= 0) return DEFAULT_LIMIT;
  return Math.min(normalized, MAX_LIMIT);
}

function serialize<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "string" ? value.toString() : value,
    ),
  ) as T;
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

async function ensureCompanyAccess(companyId: string, organizationId: string) {
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

async function loadUpload(
  companyId: string,
  organizationId: string,
  uploadId: string,
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

async function isPublishedUpload(
  companyId: string,
  type: SalaryIncomeType,
  uploadId: string,
) {
  const pointer = await prisma.companyActiveUpload.findUnique({
    where: {
      companyId_type: {
        companyId,
        type,
      },
    },
    select: {
      uploadId: true,
    },
  });

  return pointer?.uploadId === uploadId;
}

async function loadPreviewRows(uploadId: string, type: SalaryIncomeType, limit: number) {
  if (type === "EARNED_INCOME") {
    const where = { uploadId };
    const [total, rows] = await Promise.all([
      prisma.earnedIncome.count({ where }),
      prisma.earnedIncome.findMany({
        where,
        orderBy: [
          { accrualYm: "desc" },
          { paymentYm: "desc" },
          { employeeCode: "asc" },
        ],
        take: limit,
        select: {
          employeeCode: true,
          employeeName: true,
          accrualYm: true,
          paymentYm: true,
          payDate: true,
          totalPayment: true,
          totalDeduction: true,
          netPayment: true,
        },
      }),
    ]);

    return {
      total,
      columns: [
        { key: "employeeCode", label: "사원코드" },
        { key: "employeeName", label: "사원명" },
        { key: "accrualYm", label: "귀속년월" },
        { key: "paymentYm", label: "지급년월" },
        { key: "payDate", label: "지급일" },
        { key: "totalPayment", label: "지급액계" },
        { key: "totalDeduction", label: "공제액계" },
        { key: "netPayment", label: "차인지급액" },
      ],
      rows: rows.map((row) => ({
        ...row,
        accrualYm: String(row.accrualYm),
        paymentYm: String(row.paymentYm),
      })),
    };
  }

  if (type === "BUSINESS_INCOME") {
    const where = { uploadId };
    const [total, rows] = await Promise.all([
      prisma.businessIncome.count({ where }),
      prisma.businessIncome.findMany({
        where,
        orderBy: [
          { accrualYm: "desc" },
          { paymentYm: "desc" },
          { employeeCode: "asc" },
        ],
        take: limit,
        select: {
          employeeCode: true,
          employeeName: true,
          accrualYm: true,
          paymentYm: true,
          grossPayment: true,
          incomeTax: true,
          localIncomeTax: true,
          netPayment: true,
        },
      }),
    ]);

    return {
      total,
      columns: [
        { key: "employeeCode", label: "코드" },
        { key: "employeeName", label: "성명" },
        { key: "accrualYm", label: "귀속년월" },
        { key: "paymentYm", label: "지급년월" },
        { key: "grossPayment", label: "지급액" },
        { key: "incomeTax", label: "소득세" },
        { key: "localIncomeTax", label: "지방소득세" },
        { key: "netPayment", label: "차인지급액" },
      ],
      rows: rows.map((row) => ({
        ...row,
        accrualYm: String(row.accrualYm),
        paymentYm: String(row.paymentYm),
      })),
    };
  }

  if (type === "OTHER_INCOME") {
    const where = { uploadId };
    const [total, rows] = await Promise.all([
      prisma.otherIncome.count({ where }),
      prisma.otherIncome.findMany({
        where,
        orderBy: [
          { accrualYm: "desc" },
          { paymentYm: "desc" },
          { employeeCode: "asc" },
        ],
        take: limit,
        select: {
          employeeCode: true,
          employeeName: true,
          incomeType: true,
          accrualYm: true,
          paymentYm: true,
          grossPayment: true,
          taxCorpTax: true,
          localIncomeTax: true,
          netPayment: true,
        },
      }),
    ]);

    return {
      total,
      columns: [
        { key: "employeeCode", label: "코드" },
        { key: "employeeName", label: "성명" },
        { key: "incomeType", label: "소득구분" },
        { key: "accrualYm", label: "귀속년월" },
        { key: "paymentYm", label: "지급년월" },
        { key: "grossPayment", label: "지급액" },
        { key: "taxCorpTax", label: "소득세/법인세" },
        { key: "localIncomeTax", label: "지방소득세" },
        { key: "netPayment", label: "차인지급액" },
      ],
      rows: rows.map((row) => ({
        ...row,
        accrualYm: String(row.accrualYm),
        paymentYm: String(row.paymentYm),
      })),
    };
  }

  const where = { uploadId };
  const [total, rows] = await Promise.all([
    prisma.dailyIncomeLabor.count({ where }),
    prisma.dailyIncomeLabor.findMany({
      where,
      orderBy: [{ employeeCode: "asc" }, { employeeName: "asc" }],
      take: limit,
      select: {
        employeeCode: true,
        employeeName: true,
        jobType: true,
        workDays: true,
        grossPay: true,
        incomeTax: true,
        localIncomeTax: true,
        netPay: true,
      },
    }),
  ]);

  return {
    total,
    columns: [
      { key: "employeeCode", label: "코드" },
      { key: "employeeName", label: "성명" },
      { key: "jobType", label: "직종" },
      { key: "workDays", label: "근무일수" },
      { key: "grossPay", label: "급여총액" },
      { key: "incomeTax", label: "소득세" },
      { key: "localIncomeTax", label: "지방소득세" },
      { key: "netPay", label: "차인지급액" },
    ],
    rows,
  };
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; uploadId: string }>;
  },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id, uploadId } = await params;
    const companyId = parseObjectIdOrNull(id);
    if (!companyId) {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const parsedUploadId = parseObjectIdOrNull(uploadId);
    if (!parsedUploadId) {
      return NextResponse.json(
        { error: "유효한 업로드 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const hasAccess = await ensureCompanyAccess(companyId, auth.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const upload = await loadUpload(companyId, auth.organizationId, parsedUploadId);
    if (!upload) {
      return NextResponse.json(
        { error: "업로드를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const canManage = canManageUpload(upload.memo, auth.userId);
    const published = await isPublishedUpload(
      upload.companyId,
      upload.type as SalaryIncomeType,
      upload.id,
    );

    if (!canManage && !published) {
      return NextResponse.json(
        { error: "해당 업로드 열람 권한이 없습니다." },
        { status: 403 },
      );
    }

    const limit = parseLimit(request);
    const preview = await loadPreviewRows(
      upload.id,
      upload.type as SalaryIncomeType,
      limit,
    );

    return NextResponse.json(
      serialize({
        success: true,
        upload: {
          uploadId: upload.id,
          incomeType: upload.type,
          incomeTypeLabel: INCOME_TYPE_LABELS[upload.type as SalaryIncomeType],
          fileName: upload.fileName,
          uploadedAt: upload.uploadedAt,
          publishStatus: published ? "PUBLISHED" : "SAVED",
          companyVisible: published,
        },
        columns: preview.columns,
        rows: preview.rows,
        total: preview.total,
        limit,
      }),
    );
  } catch (error) {
    console.error("Agent salary publication preview GET error:", error);
    return NextResponse.json(
      { error: "업로드 미리보기를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
