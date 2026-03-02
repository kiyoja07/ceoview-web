import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
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

    const { searchParams } = new URL(request.url);
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
      "OTHER_INCOME_LABOR",
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

    const [total, rows] = await Promise.all([
      prisma.dailyIncomeLabor.count({ where }),
      prisma.dailyIncomeLabor.findMany({
        where,
        orderBy: [{ employeeCode: "asc" }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return NextResponse.json({
      company: serialize(entity),
      publication: serializeUploadViewSelection(uploadView),
      rows: rows.map(serialize),
      total,
      page,
      size,
    });
  } catch (error) {
    console.error("일용직소득 조회 실패:", error);
    return NextResponse.json(
      { error: "일용직소득 데이터를 불러오는 데 실패했습니다." },
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
