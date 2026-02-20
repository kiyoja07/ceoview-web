import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

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
    const businessEntityId = BigInt(id);

    const { searchParams } = new URL(request.url);
    const months = Math.min(
      Math.max(parseInt(searchParams.get("months") ?? "12", 10) || 12, 1),
      60,
    );

    // 사업자 존재 확인
    const entity = await prisma.businessEntity.findUnique({
      where: { id: businessEntityId },
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

    // ──────── 업로드 ID 목록 (타입별) ────────
    const allUploads = await prisma.upload.findMany({
      where: { businessEntityId },
      select: { id: true, type: true, uploadedAt: true },
    });

    const uploadsByType = {
      EARNED_INCOME: allUploads
        .filter((u) => u.type === "EARNED_INCOME")
        .map((u) => u.id),
      BUSINESS_INCOME: allUploads
        .filter((u) => u.type === "BUSINESS_INCOME")
        .map((u) => u.id),
      OTHER_INCOME: allUploads
        .filter((u) => u.type === "OTHER_INCOME")
        .map((u) => u.id),
      OTHER_INCOME_LABOR: allUploads.filter(
        (u) => u.type === "OTHER_INCOME_LABOR",
      ),
    };

    // ──────── 근로소득 (paymentYm 기준) ────────
    const earnedStats =
      uploadsByType.EARNED_INCOME.length > 0
        ? await prisma.earnedIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: { in: uploadsByType.EARNED_INCOME },
              paymentYm: { gte: startYm, lte: endYm },
            },
            _sum: {
              totalPayment: true,
              totalDeduction: true,
              netPayment: true,
            },
          })
        : [];

    // ──────── 사업소득 (paymentYm 기준) ────────
    const businessStats =
      uploadsByType.BUSINESS_INCOME.length > 0
        ? await prisma.businessIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: { in: uploadsByType.BUSINESS_INCOME },
              paymentYm: { gte: startYm, lte: endYm },
            },
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
      uploadsByType.OTHER_INCOME.length > 0
        ? await prisma.otherIncome.groupBy({
            by: ["paymentYm"],
            where: {
              uploadId: { in: uploadsByType.OTHER_INCOME },
              paymentYm: { gte: startYm, lte: endYm },
            },
            _sum: {
              grossPayment: true,
              taxCorpTax: true,
              localIncomeTax: true,
              netPayment: true,
            },
          })
        : [];

    // ──────── 일용직소득 (Upload.uploadedAt 월 기준) ────────
    const dailyUploadEntries = uploadsByType.OTHER_INCOME_LABOR;
    const dailyByMonth: Map<
      number,
      {
        totalPayment: number;
        totalDeduction: number;
        netPayment: number;
        dailyPayment: number;
      }
    > = new Map();

    if (dailyUploadEntries.length > 0) {
      // uploadId → ym 매핑
      const uploadYmMap = new Map<bigint, number>();
      for (const u of dailyUploadEntries) {
        const ym =
          u.uploadedAt.getFullYear() * 100 + (u.uploadedAt.getMonth() + 1);
        if (ym >= startYm && ym <= endYm) {
          uploadYmMap.set(u.id, ym);
        }
      }

      if (uploadYmMap.size > 0) {
        const dailyGrouped = await prisma.dailyIncomeLabor.groupBy({
          by: ["uploadId"],
          where: { uploadId: { in: [...uploadYmMap.keys()] } },
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
          const ym = uploadYmMap.get(row.uploadId);
          if (!ym) continue;

          const existing = dailyByMonth.get(ym) ?? {
            totalPayment: 0,
            totalDeduction: 0,
            netPayment: 0,
            dailyPayment: 0,
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
      };
      const payment = Number(row._sum.totalPayment ?? 0);

      entry.totalPayment += payment;
      entry.totalDeduction += Number(row._sum.totalDeduction ?? 0);
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.earnedPayment += payment;
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
      };
      const payment = Number(row._sum.grossPayment ?? 0);

      entry.totalPayment += payment;
      entry.totalDeduction +=
        Number(row._sum.taxCorpTax ?? 0) + Number(row._sum.localIncomeTax ?? 0);
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.otherPayment += payment;
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
      };
      entry.totalPayment += vals.totalPayment;
      entry.totalDeduction += vals.totalDeduction;
      entry.netPayment += vals.netPayment;
      entry.dailyPayment += vals.dailyPayment;
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
      }));

    return NextResponse.json({
      businessEntity: serialize(entity),
      months,
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
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}
