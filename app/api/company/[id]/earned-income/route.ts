import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { EARNED_ITEM_CODE_STUDENT_LOAN_REPAYMENT } from "@/app/lib/payroll-items";
import {
  resolveUploadForCompanyView,
  serializeUploadViewSelection,
} from "@/app/lib/salary-upload-view";

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

    const uploadView = await resolveUploadForCompanyView(
      request,
      companyId,
      "EARNED_INCOME",
    );

    if (!uploadView.uploadId) {
      return NextResponse.json({
        company: serialize(entity),
        publication: serializeUploadViewSelection(uploadView),
        rows: [],
        total: 0,
        page,
        size,
      });
    }

    const where: Record<string, unknown> = {
      uploadId: uploadView.uploadId,
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
          employee: {
            select: { email: true, phone: true },
          },
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
          payslipNotifications: {
            where: { status: "SENT" },
            orderBy: { sentAt: "desc" },
            take: 1,
            select: { sentAt: true },
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

    // Fallback: for rows without a linked employee, look up by employeeCode
    const unlinkedCodes = [
      ...new Set(rows.filter((r) => !r.employee).map((r) => r.employeeCode)),
    ];
    const employeeByCode = new Map<
      string,
      { email: string | null; phone: string | null }
    >();
    if (unlinkedCodes.length > 0) {
      const employees = await prisma.employee.findMany({
        where: {
          companyId,
          employeeCode: { in: unlinkedCodes },
          deletedAt: null,
        },
        select: { employeeCode: true, email: true, phone: true },
      });
      for (const emp of employees) {
        if (emp.employeeCode) {
          employeeByCode.set(emp.employeeCode, {
            email: emp.email,
            phone: emp.phone,
          });
        }
      }
    }

    const serializedRows = rows.map((row) => {
      const { itemValues, employee, payslipNotifications, ...baseRow } = row;
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

      const fallback = employeeByCode.get(baseRow.employeeCode);

      return serialize({
        ...baseRow,
        dynamicPaymentItems,
        dynamicDeductionItems,
        studentLoanRepayment,
        employeeEmail: employee?.email ?? fallback?.email ?? null,
        employeePhone: employee?.phone ?? fallback?.phone ?? null,
        lastSentAt: payslipNotifications[0]?.sentAt ?? null,
      });
    });

    return NextResponse.json({
      company: serialize(entity),
      publication: serializeUploadViewSelection(uploadView),
      rows: serializedRows,
      total,
      page,
      size,
    });
  } catch (error) {
    console.error("근로소득 조회 실패:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "근로소득 데이터를 불러오는 데 실패했습니다.", detail: message },
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
