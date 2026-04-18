import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { attachEmployeeSession } from "@/app/lib/employee-auth";
import { normalizeEmployeePhone } from "@/app/lib/employee-contact";
import { isValidEmail } from "@/app/lib/employee-magic-link";
import { verifyEmployeeSignupGrant } from "@/app/lib/employee-signup-grant";
import prisma from "@/app/lib/prisma";
import type { EmployeeSignupFromPayslipBody } from "@/types/employee/auth";

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmployeeSignupFromPayslipBody;
    const signupGrant = verifyEmployeeSignupGrant(body.signupGrant?.trim());

    if (!signupGrant) {
      return NextResponse.json(
        { error: "직원 가입 확인 정보가 만료되었거나 유효하지 않습니다." },
        { status: 410 },
      );
    }

    let employeeId: bigint;
    let companyId: bigint;
    try {
      employeeId = BigInt(signupGrant.employeeId);
      companyId = BigInt(signupGrant.companyId);
    } catch {
      return NextResponse.json(
        { error: "직원 가입 확인 정보가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        zipcode: true,
        address: true,
        addressDetail: true,
        user: {
          select: {
            id: true,
            isActive: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const recipient = signupGrant.recipient.trim();
    let email: string | null = null;
    let phone: string | null = null;

    if (signupGrant.channel === "EMAIL") {
      email = recipient.toLowerCase();
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "검증된 이메일 정보가 올바르지 않습니다." },
          { status: 400 },
        );
      }
    } else {
      phone = normalizeEmployeePhone(recipient);
      if (!phone) {
        return NextResponse.json(
          { error: "검증된 전화번호 정보가 올바르지 않습니다." },
          { status: 400 },
        );
      }
    }

    if (employee.user) {
      const normalizedEmployeePhone = employee.phone
        ? normalizeEmployeePhone(employee.phone)
        : null;

      await prisma.employeeUser.update({
        where: { id: employee.user.id },
        data: {
          name: employee.name.slice(0, 100),
          email: employee.user.email ?? employee.email ?? email,
          phone: employee.user.phone ?? normalizedEmployeePhone ?? phone,
          zipcode: employee.zipcode,
          address: employee.address,
          addressDetail: employee.addressDetail,
        },
      });

      if (!employee.user.isActive) {
        return NextResponse.json(
          { error: "비활성화된 직원 계정입니다. 관리자에게 문의해주세요." },
          { status: 403 },
        );
      }

      const response = NextResponse.json({
        message: "직원 계정이 이미 있습니다. 바로 로그인 상태로 전환했습니다.",
        employeeAccountExists: true,
        redirectTo: "/employee",
      });
      attachEmployeeSession(response, employee.user.id);
      return response;
    }

    let user:
      | {
          id: bigint;
          isActive: boolean;
        }
      | null = null;

    try {
      user = await prisma.employeeUser.create({
        data: {
          employeeId: employee.id,
          name: employee.name.slice(0, 100),
          email: employee.email ?? email,
          phone: employee.phone ? normalizeEmployeePhone(employee.phone) : phone,
          zipcode: employee.zipcode,
          address: employee.address,
          addressDetail: employee.addressDetail,
        },
        select: {
          id: true,
          isActive: true,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existingByEmployee = await prisma.employeeUser.findUnique({
        where: { employeeId: employee.id },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (existingByEmployee) {
        user = existingByEmployee;
      } else {
        const conflictWhere: Prisma.EmployeeUserWhereInput = {
          OR: [
            email ? { email } : undefined,
            phone ? { phone } : undefined,
          ].filter(Boolean) as Prisma.EmployeeUserWhereInput[],
        };

        const conflictingUser = await prisma.employeeUser.findFirst({
          where: conflictWhere,
          select: {
            id: true,
          },
        });

        if (conflictingUser) {
          return NextResponse.json(
            {
              error:
                "해당 연락처는 다른 직원 계정에서 이미 사용 중입니다. 관리자에게 문의해주세요.",
            },
            { status: 409 },
          );
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "직원 계정을 생성하지 못했습니다." },
        { status: 500 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "비활성화된 직원 계정입니다. 관리자에게 문의해주세요." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      message: "직원 계정 생성이 완료되었습니다.",
      employeeAccountExists: false,
      redirectTo: "/employee",
    });
    attachEmployeeSession(response, user.id);
    return response;
  } catch (error) {
    console.error("Employee signup from payslip error:", error);
    return NextResponse.json(
      { error: "직원 계정 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
