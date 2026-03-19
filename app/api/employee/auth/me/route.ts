import { NextRequest, NextResponse } from "next/server";
import { getEmployeeUserIdFromRequest } from "@/app/lib/employee-auth";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = getEmployeeUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.employeeUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        zipcode: true,
        address: true,
        addressDetail: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            department: true,
            positionTitle: true,
            deletedAt: true,
            company: {
              select: {
                id: true,
                businessName: true,
                businessNumber: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.employee.deletedAt) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      zipcode: user.zipcode,
      address: user.address,
      addressDetail: user.addressDetail,
      isActive: user.isActive,
      employee: {
        id: user.employee.id.toString(),
        employeeCode: user.employee.employeeCode,
        department: user.employee.department,
        positionTitle: user.employee.positionTitle,
      },
      company: {
        id: user.employee.company.id.toString(),
        businessName: user.employee.company.businessName,
        businessNumber: user.employee.company.businessNumber,
      },
    });
  } catch (error) {
    console.error("Employee me error:", error);
    return NextResponse.json(
      { error: "직원 정보를 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}
