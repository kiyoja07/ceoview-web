import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  resolveUploadForCompanyView,
  serializeUploadViewSelection,
} from "@/app/lib/salary-upload-view";

/**
 * GET /api/company/[id]/salary-stats?months=12
 *
 * 최근 N개월 (기본 12개월) 동안의 월별 소득유형별 지급액(근로/사업/일용/기타)
 * 및 총지급액 / 총공제액 / 차인지급액 통계를 반환합니다.
 * 근로·사업·기타소득은 paymentYm 기준, 일용직은 Upload.uploadedAt 기준으로 집계합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const companyId = id;

    const { searchParams } = new URL(request.url);
    const months = Math.min(
      Math.max(parseInt(searchParams.get("months") ?? "12", 10) || 12, 1),
      60,
    );

    // 사업자 존재 확인
    const entity = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, businessName: true, businessNumber: true },
    });

    if (!entity) {
      return NextResponse.json(
        { error: "사업자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 기간 계산 (현재 월부터 N개월 전까지)
    const now = new Date();
    const endYm = now.getFullYear() * 100 + (now.getMonth() + 1); // e.g. 202602
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1,
    );
    const startYm = startDate.getFullYear() * 100 + (startDate.getMonth() + 1); // e.g. 202503

    const [earnedView, businessView, otherView, dailyView] = await Promise.all([
      resolveUploadForCompanyView(request, companyId, "EARNED_INCOME"),
      resolveUploadForCompanyView(request, companyId, "BUSINESS_INCOME"),
      resolveUploadForCompanyView(request, companyId, "OTHER_INCOME"),
      resolveUploadForCompanyView(request, companyId, "OTHER_INCOME_LABOR"),
    ]);

    // ──────── 근로소득 (paymentYm 기준) ────────
    const earnedStats =
      earnedView.uploadId
        ? await prisma.earnedIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: earnedView.uploadId,
              paymentYm: { gte: startYm, lte: endYm },
            },
            _count: true,
            _sum: {
              totalPayment: true,
              totalDeduction: true,
              netPayment: true,
            },
          })
        : [];

    // ──────── 사업소득 (paymentYm 기준) ────────
    const businessStats =
      businessView.uploadId
        ? await prisma.businessIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: businessView.uploadId,
              paymentYm: { gte: startYm, lte: endYm },
            },
            _count: true,
            _sum: {
              grossPayment: true,
              incomeTax: true,
              localIncomeTax: true,
              expenseArtSpec: true,
              employmentIns: true,
              studentLoan: true,
              industrialAcc: true,
              netPayment: true,
            },
          })
        : [];

    // ──────── 기타소득 (paymentYm 기준) ────────
    const otherStats =
      otherView.uploadId
        ? await prisma.otherIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: otherView.uploadId,
              paymentYm: { gte: startYm, lte: endYm },
            },
            _count: true,
            _sum: {
              grossPayment: true,
              taxCorpTax: true,
              localIncomeTax: true,
              netPayment: true,
            },
          })
        : [];

    // ──────── 일용직소득 (Upload.uploadedAt 월 기준) ────────
    const dailyByMonth: Map<
      number,
      {
        totalPayment: number;
        totalDeduction: number;
        netPayment: number;
        dailyPayment: number;
        dailyCount: number;
      }
    > = new Map();

    if (dailyView.uploadId && dailyView.uploadedAt) {
      const ym =
        dailyView.uploadedAt.getFullYear() * 100 +
        (dailyView.uploadedAt.getMonth() + 1);

      if (ym >= startYm && ym <= endYm) {
        const dailyGrouped = await prisma.dailyIncomeLabor.groupBy({
          by: ["uploadId"],
          where: { uploadId: dailyView.uploadId },
          _count: true,
          _sum: {
            grossPay: true,
            employmentIns: true,
            nationalPension: true,
            healthIns: true,
            incomeTax: true,
            localIncomeTax: true,
            longTermCare: true,
            netPay: true,
          },
        });

        for (const row of dailyGrouped) {
          const existing = dailyByMonth.get(ym) ?? {
            totalPayment: 0,
            totalDeduction: 0,
            netPayment: 0,
            dailyPayment: 0,
            dailyCount: 0,
          };

          const totalDeduction =
            Number(row._sum.employmentIns ?? 0) +
            Number(row._sum.nationalPension ?? 0) +
            Number(row._sum.healthIns ?? 0) +
            Number(row._sum.incomeTax ?? 0) +
            Number(row._sum.localIncomeTax ?? 0) +
            Number(row._sum.longTermCare ?? 0);

          const grossPay = Number(row._sum.grossPay ?? 0);

          existing.totalPayment += grossPay;
          existing.totalDeduction += totalDeduction;
          existing.netPayment += Number(row._sum.netPay ?? 0);
          existing.dailyPayment += grossPay;
          existing.dailyCount += row._count;
          dailyByMonth.set(ym, existing);
        }
      }
    }

    // ──────── 월별 합산 ────────
    const monthlyMap = new Map<
      number,
      {
        totalPayment: number;
        totalDeduction: number;
        netPayment: number;
        earnedPayment: number;
        businessPayment: number;
        dailyPayment: number;
        otherPayment: number;
        earnedCount: number;
        businessCount: number;
        dailyCount: number;
        otherCount: number;
      }
    >();

    // 빈 달도 포함되도록 모든 월 초기화
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.getFullYear() * 100 + (d.getMonth() + 1);
      monthlyMap.set(ym, {
        totalPayment: 0,
        totalDeduction: 0,
        netPayment: 0,
        earnedPayment: 0,
        businessPayment: 0,
        dailyPayment: 0,
        otherPayment: 0,
        earnedCount: 0,
        businessCount: 0,
        dailyCount: 0,
        otherCount: 0,
      });
    }

    // 근로소득 합산
    for (const row of earnedStats) {
      const entry = monthlyMap.get(row.paymentYm) ?? {
        totalPayment: 0,
        totalDeduction: 0,
        netPayment: 0,
        earnedPayment: 0,
        businessPayment: 0,
        dailyPayment: 0,
        otherPayment: 0,
        earnedCount: 0,
        businessCount: 0,
        dailyCount: 0,
        otherCount: 0,
      };
      const payment = Number(row._sum.totalPayment ?? 0);

      entry.totalPayment += payment;
      entry.totalDeduction += Number(row._sum.totalDeduction ?? 0);
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.earnedPayment += payment;
      entry.earnedCount += row._count;
      monthlyMap.set(row.paymentYm, entry);
    }

    // 사업소득 합산
    for (const row of businessStats) {
      const entry = monthlyMap.get(row.paymentYm) ?? {
        totalPayment: 0,
        totalDeduction: 0,
        netPayment: 0,
        earnedPayment: 0,
        businessPayment: 0,
        dailyPayment: 0,
        otherPayment: 0,
        earnedCount: 0,
        businessCount: 0,
        dailyCount: 0,
        otherCount: 0,
      };
      const payment = Number(row._sum.grossPayment ?? 0);
      const deduction =
        Number(row._sum.incomeTax ?? 0) +
        Number(row._sum.localIncomeTax ?? 0) +
        Number(row._sum.expenseArtSpec ?? 0) +
        Number(row._sum.employmentIns ?? 0) +
        Number(row._sum.studentLoan ?? 0) +
        Number(row._sum.industrialAcc ?? 0);

      entry.totalPayment += payment;
      entry.totalDeduction += deduction;
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.businessPayment += payment;
      entry.businessCount += row._count;
      monthlyMap.set(row.paymentYm, entry);
    }

    // 기타소득 합산
    for (const row of otherStats) {
      const entry = monthlyMap.get(row.paymentYm) ?? {
        totalPayment: 0,
        totalDeduction: 0,
        netPayment: 0,
        earnedPayment: 0,
        businessPayment: 0,
        dailyPayment: 0,
        otherPayment: 0,
        earnedCount: 0,
        businessCount: 0,
        dailyCount: 0,
        otherCount: 0,
      };
      const payment = Number(row._sum.grossPayment ?? 0);

      entry.totalPayment += payment;
      entry.totalDeduction +=
        Number(row._sum.taxCorpTax ?? 0) + Number(row._sum.localIncomeTax ?? 0);
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.otherPayment += payment;
      entry.otherCount += row._count;
      monthlyMap.set(row.paymentYm, entry);
    }

    // 일용직소득 합산
    for (const [ym, vals] of dailyByMonth) {
      const entry = monthlyMap.get(ym) ?? {
        totalPayment: 0,
        totalDeduction: 0,
        netPayment: 0,
        earnedPayment: 0,
        businessPayment: 0,
        dailyPayment: 0,
        otherPayment: 0,
        earnedCount: 0,
        businessCount: 0,
        dailyCount: 0,
        otherCount: 0,
      };
      entry.totalPayment += vals.totalPayment;
      entry.totalDeduction += vals.totalDeduction;
      entry.netPayment += vals.netPayment;
      entry.dailyPayment += vals.dailyPayment;
      entry.dailyCount += vals.dailyCount;
      monthlyMap.set(ym, entry);
    }

    // 정렬된 결과 배열 반환
    const stats = [...monthlyMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([ym, vals]) => ({
        ym,
        label: `${String(ym).slice(0, 4)}.${String(ym).slice(4)}`,
        earnedPayment: Math.round(vals.earnedPayment),
        businessPayment: Math.round(vals.businessPayment),
        dailyPayment: Math.round(vals.dailyPayment),
        otherPayment: Math.round(vals.otherPayment),
        totalPayment: Math.round(vals.totalPayment),
        totalDeduction: Math.round(vals.totalDeduction),
        netPayment: Math.round(vals.netPayment),
        earnedCount: vals.earnedCount,
        businessCount: vals.businessCount,
        dailyCount: vals.dailyCount,
        otherCount: vals.otherCount,
        totalCount:
          vals.earnedCount +
          vals.businessCount +
          vals.dailyCount +
          vals.otherCount,
      }));

    return NextResponse.json({
      company: serialize(entity),
      months,
      publicationByType: {
        earned: serializeUploadViewSelection(earnedView),
        business: serializeUploadViewSelection(businessView),
        other: serializeUploadViewSelection(otherView),
        daily: serializeUploadViewSelection(dailyView),
      },
      stats,
    });
  } catch (error) {
    console.error("급여 통계 조회 실패:", error);
    return NextResponse.json(
      { error: "급여 통계를 불러오는 데 실패했습니다." },
      { status: 500 },
    );
  }
}

/** BigInt / Decimal → JSON 직렬화 헬퍼 */
function serialize<T>(obj: T): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "string" ? value.toString() : value,
    ),
  );
}
