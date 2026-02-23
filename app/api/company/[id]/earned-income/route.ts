import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT } from "@/app/lib/payroll-items";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const companyId = BigInt(id);

    // 쿼리 파라미터: 귀속년월 필터 (선택)
    const { searchParams } = new URL(request.url);
    const accrualYm = searchParams.get("accrualYm");
    const paymentYm = searchParams.get("paymentYm");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const size = parseInt(searchParams.get("size") ?? "50", 10);

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

    // 해당 사업자의 EARNED_INCOME 업로드 ID 목록
    const uploadIds = await prisma.upload.findMany({
      where: {
        companyId,
        type: "EARNED_INCOME",
      },
      select: { id: true },
    });

    if (uploadIds.length === 0) {
      return NextResponse.json({
        company: serialize(entity),
        rows: [],
        total: 0,
        page,
        size,
      });
    }

    const where: Record<string, unknown> = {
      uploadId: { in: uploadIds.map((u) => u.id) },
    };

    if (accrualYm) {
      where.accrualYm = parseInt(accrualYm, 10);
    }
    if (paymentYm) {
      where.paymentYm = parseInt(paymentYm, 10);
    }

    const [total, rows] = await Promise.all([
      prisma.earnedIncome.count({ where }),
      prisma.earnedIncome.findMany({
        where,
        include: {
          itemValues: {
            include: {
              itemDefinition: {
                select: {
                  code: true,
                  name: true,
                  kind: true,
                },
              },
            },
          },
        },
        orderBy: [
          { accrualYm: "desc" },
          { paymentYm: "desc" },
          { employeeCode: "asc" },
        ],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    const serializedRows = rows.map((row) => {
      const { itemValues, ...baseRow } = row;
      const dynamicPaymentItems = itemValues
        .filter((item) => item.itemDefinition.kind === "PAYMENT")
        .map((item) => ({
          code: item.itemDefinition.code,
          name: item.itemDefinition.name,
          amount: item.amount,
        }));
      const dynamicDeductionItems = itemValues
        .filter((item) => item.itemDefinition.kind === "DEDUCTION")
        .map((item) => ({
          code: item.itemDefinition.code,
          name: item.itemDefinition.name,
          amount: item.amount,
        }));
      const studentLoanRepayment =
        dynamicDeductionItems.find(
          (item) => item.code === EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT,
        )?.amount ?? 0;

      return serialize({
        ...baseRow,
        dynamicPaymentItems,
        dynamicDeductionItems,
        studentLoanRepayment,
      });
    });

    return NextResponse.json({
      company: serialize(entity),
      rows: serializedRows,
      total,
      page,
      size,
    });
  } catch (error) {
    console.error("근로소득 조회 실패:", error);
    return NextResponse.json(
      { error: "근로소득 데이터를 불러오는 데 실패했습니다." },
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
