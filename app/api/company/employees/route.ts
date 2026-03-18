import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";
import type { EmployeeCreateBody } from "@/types/company/employees";
import { getEmployeeStatus } from "@/types/company/employees";

async function requireCompanyMember(request: NextRequest) {
  const userId = getCompanyUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.companyUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      isMaster: true,
      companyId: true,
    },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    isMaster: user.isMaster,
  } as const;
}

function toId(value: bigint) {
  return value.toString();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit")) || 50),
    );
    const search = url.searchParams.get("search")?.trim() || "";

    const where: {
      companyId: bigint;
      deletedAt: null;
      publishStatus: "PUBLISHED";
      OR?: {
        name?: { contains: string };
        employeeCode?: { contains: string };
        department?: { contains: string };
      }[];
    } = {
      companyId: auth.companyId,
      deletedAt: null,
      publishStatus: "PUBLISHED",
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employeeCode: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          bankAccounts: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      employees: employees.map((emp) => {
        const ba = emp.bankAccounts[0] ?? null;
        return {
          id: toId(emp.id),
          employeeCode: emp.employeeCode,
          name: emp.name,
          residentNumber: emp.residentNumber,
          department: emp.department,
          positionTitle: emp.positionTitle,
          email: emp.email,
          phone: emp.phone,
          hireDate: emp.hireDate,
          resignDate: emp.resignDate,
          createdAt: emp.createdAt.toISOString(),
          bankAccount: ba
            ? {
                bankName: ba.bankName,
                accountNumber: ba.accountNumber,
                accountHolder: ba.accountHolder,
              }
            : null,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Employee list GET error:", error);
    return NextResponse.json(
      { error: "직원 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: "직원 등록은 마스터 사용자만 가능합니다." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as EmployeeCreateBody;

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해주세요." },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.create({
      data: {
        companyId: auth.companyId,
        employeeCode: body.employeeCode?.trim() || null,
        name,
        residentNumber: body.residentNumber?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        hireDate: body.hireDate?.trim() || null,
        resignDate: body.resignDate?.trim() || null,
        zipcode: body.zipcode?.trim() || null,
        address: body.address?.trim() || null,
        addressDetail: body.addressDetail?.trim() || null,
        bankAccounts: {
          create:
            body.bankAccounts
              ?.filter((ba) => ba.bankName?.trim() && ba.accountNumber?.trim())
              .map((ba) => ({
                bankName: ba.bankName.trim(),
                accountNumber: ba.accountNumber.trim(),
                accountHolder: ba.accountHolder?.trim() || name,
              })) ?? [],
        },
      },
      include: {
        bankAccounts: true,
      },
    });

    return NextResponse.json({
      id: toId(employee.id),
      employeeCode: employee.employeeCode,
      name: employee.name,
      residentNumber: employee.residentNumber,
      email: employee.email,
      phone: employee.phone,
      hireDate: employee.hireDate,
      resignDate: employee.resignDate,
      status: getEmployeeStatus(employee.hireDate, employee.resignDate),
      zipcode: employee.zipcode,
      address: employee.address,
      addressDetail: employee.addressDetail,
      bankAccounts: employee.bankAccounts.map((ba) => ({
        id: toId(ba.id),
        bankName: ba.bankName,
        accountNumber: ba.accountNumber,
        accountHolder: ba.accountHolder,
      })),
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Employee POST error:", error);
    return NextResponse.json(
      { error: "직원 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
