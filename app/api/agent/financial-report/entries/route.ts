import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  ensureCompanyAccess,
  requireAgentOrganizationId,
} from "../_lib/agent-access";

type FilterType = "all" | "revenue" | "expense" | "unspecified";

/**
 * GET /api/agent/financial-report/entries?companyId=...&reportId=...&page=1&size=50
 * 짝지은 거래 내역(차변/대변) 원장 표를 반환한다.
 * 세무대리인 전용 데이터라 거래처(company) 세션으로는 접근할 수 없다.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentOrganizationId(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const reportId = searchParams.get("reportId");

  if (!companyId) {
    return NextResponse.json(
      { error: "사업자를 선택해주세요." },
      { status: 400 },
    );
  }
  if (!reportId) {
    return NextResponse.json(
      { error: "리포트를 선택해주세요." },
      { status: 400 },
    );
  }

  const hasAccess = await ensureCompanyAccess(auth.organizationId, companyId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "접근 권한이 없는 사업자입니다." },
      { status: 403 },
    );
  }

  const report = await prisma.financialReport.findFirst({
    where: {
      id: reportId,
      companyId,
      agentOrganizationId: auth.organizationId,
    },
    select: {
      id: true,
      fiscalYear: true,
      fileName: true,
      entryCount: true,
      debitTotal: true,
      creditTotal: true,
      uploadedAt: true,
    },
  });

  if (!report) {
    return NextResponse.json(
      { error: "리포트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const size = Math.min(
    Math.max(parseInt(searchParams.get("size") ?? "50", 10) || 50, 1),
    200,
  );

  const type = searchParams.get("type") ?? "all";
  const typeWhere =
    type === "revenue"
      ? { creditIsRevenue: true }
      : type === "expense"
        ? { debitIsExpense: true }
        : type === "unspecified"
          ? { creditIsRevenue: false, debitIsExpense: false }
          : {};

  const [statRows, rows] = await Promise.all([
    prisma.financialReportEntry.findMany({
      where: { reportId },
      select: {
        gubunja: true,
        debitCode: true,
        debitAmount: true,
        debitIsRevenue: true,
        debitIsExpense: true,
        creditCode: true,
        creditAmount: true,
        creditIsRevenue: true,
      },
    }),
    prisma.financialReportEntry.findMany({
      where: { reportId, ...typeWhere },
      orderBy: { rowIndex: "asc" },
      skip: (page - 1) * size,
      take: size,
      select: {
        rowIndex: true,
        gubunja: true,
        yearMonth: true,
        entryDate: true,
        voucherNo: true,
        debitCode: true,
        debitAccount: true,
        debitAmount: true,
        debitStandardName: true,
        debitUsage: true,
        debitIsRevenue: true,
        debitIsExpense: true,
        debitPartnerName: true,
        creditCode: true,
        creditAccount: true,
        creditAmount: true,
        creditStandardName: true,
        creditIsRevenue: true,
        creditPartnerName: true,
      },
    }),
  ]);

  // 한 대변 라인이 여러 차변 라인과 짝지어지거나, 한 차변 라인이 여러 대변
  // 라인과 짝지어질 경우 entries 테이블에 동일한 (gubunja, code, amount) 조합이
  // 중복 저장되므로, 차변/대변 합계는 각각 그 조합 기준으로 한 번만 집계해
  // 원본 분개장과의 중복 계산을 막는다.
  type Stat = { count: number; debitSum: number; creditSum: number };
  const makeStat = (): Stat & { seenDebit: Set<string>; seenCredit: Set<string> } => ({
    count: 0,
    debitSum: 0,
    creditSum: 0,
    seenDebit: new Set(),
    seenCredit: new Set(),
  });
  const buckets = {
    all: makeStat(),
    revenue: makeStat(),
    expense: makeStat(),
    unspecified: makeStat(),
  };
  const addTo = (bucket: (typeof buckets)["all"], row: (typeof statRows)[number]) => {
    bucket.count += 1;
    if (row.debitAmount) {
      const key = `${row.gubunja}|${row.debitCode ?? ""}|${row.debitAmount}`;
      if (!bucket.seenDebit.has(key)) {
        bucket.seenDebit.add(key);
        bucket.debitSum += row.debitAmount;
      }
    }
    if (row.creditAmount) {
      const key = `${row.gubunja}|${row.creditCode ?? ""}|${row.creditAmount}`;
      if (!bucket.seenCredit.has(key)) {
        bucket.seenCredit.add(key);
        bucket.creditSum += row.creditAmount;
      }
    }
  };
  for (const row of statRows) {
    addTo(buckets.all, row);
    // 수익=대변 isRevenue, 비용=차변 isExpense (pairing.ts의 원본 집계 기준과 동일)
    if (row.creditIsRevenue) addTo(buckets.revenue, row);
    if (row.debitIsExpense) addTo(buckets.expense, row);
    if (!row.creditIsRevenue && !row.debitIsExpense) addTo(buckets.unspecified, row);
  }
  const counts: Record<FilterType, Stat> = {
    all: { count: buckets.all.count, debitSum: buckets.all.debitSum, creditSum: buckets.all.creditSum },
    revenue: { count: buckets.revenue.count, debitSum: buckets.revenue.debitSum, creditSum: buckets.revenue.creditSum },
    expense: { count: buckets.expense.count, debitSum: buckets.expense.debitSum, creditSum: buckets.expense.creditSum },
    unspecified: { count: buckets.unspecified.count, debitSum: buckets.unspecified.debitSum, creditSum: buckets.unspecified.creditSum },
  };
  const total = counts[type as FilterType]?.count ?? counts.all.count;

  return NextResponse.json({
    report: { ...report, uploadedAt: report.uploadedAt.toISOString() },
    rows,
    total,
    page,
    size,
    counts,
  });
}
