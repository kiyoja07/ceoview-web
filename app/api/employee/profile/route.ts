import { NextRequest, NextResponse } from "next/server";
import { getEmployeeUserIdFromRequest } from "@/app/lib/employee-auth";
import prisma from "@/app/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const userId = getEmployeeUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { email, phone, zipcode, address, addressDetail } = body as {
      email?: string;
      phone?: string;
      zipcode?: string;
      address?: string;
      addressDetail?: string;
    };

    const employeeUser = await prisma.employeeUser.findUnique({
      where: { id: userId },
      select: { id: true, employeeId: true, isActive: true },
    });

    if (!employeeUser || !employeeUser.isActive) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자입니다." },
        { status: 403 },
      );
    }

    const trimmedEmail = typeof email === "string" ? email.trim() : undefined;
    const trimmedPhone =
      typeof phone === "string" ? phone.replace(/\D/g, "") : undefined;

    if (trimmedEmail !== undefined && trimmedEmail !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "올바른 이메일 형식이 아닙니다." },
          { status: 400 },
        );
      }
      const existing = await prisma.employeeUser.findFirst({
        where: { email: trimmedEmail, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다." },
          { status: 409 },
        );
      }
    }

    if (trimmedPhone !== undefined && trimmedPhone !== "") {
      if (!/^01[016789]\d{7,8}$/.test(trimmedPhone)) {
        return NextResponse.json(
          { error: "올바른 휴대폰번호 형식이 아닙니다." },
          { status: 400 },
        );
      }
      const existing = await prisma.employeeUser.findFirst({
        where: { phone: trimmedPhone, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "이미 사용 중인 휴대폰번호입니다." },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, string | null> = {};
    if (trimmedEmail !== undefined) updateData.email = trimmedEmail || null;
    if (trimmedPhone !== undefined) updateData.phone = trimmedPhone || null;
    if (zipcode !== undefined) updateData.zipcode = zipcode || null;
    if (address !== undefined) updateData.address = address || null;
    if (addressDetail !== undefined)
      updateData.addressDetail = addressDetail || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "변경할 내용이 없습니다." },
        { status: 400 },
      );
    }

    // EmployeeUser, Employee 모두 업데이트
    const employeeUpdateData: Record<string, string | null> = {};
    if ("email" in updateData) employeeUpdateData.email = updateData.email;
    if ("phone" in updateData) employeeUpdateData.phone = updateData.phone;
    if ("zipcode" in updateData)
      employeeUpdateData.zipcode = updateData.zipcode;
    if ("address" in updateData)
      employeeUpdateData.address = updateData.address;
    if ("addressDetail" in updateData)
      employeeUpdateData.addressDetail = updateData.addressDetail;

    await prisma.$transaction([
      prisma.employeeUser.update({
        where: { id: userId },
        data: updateData,
      }),
      prisma.employee.update({
        where: { id: employeeUser.employeeId },
        data: employeeUpdateData,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee profile update error:", error);
    return NextResponse.json(
      { error: "프로필 수정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
