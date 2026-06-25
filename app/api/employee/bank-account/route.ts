import { NextRequest, NextResponse } from "next/server";
import { getEmployeeUserIdFromRequest } from "@/app/lib/employee-auth";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = getEmployeeUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const employeeUser = await prisma.employeeUser.findUnique({
      where: { id: userId },
      select: { employeeId: true, isActive: true },
    });

    if (!employeeUser || !employeeUser.isActive) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자입니다." },
        { status: 403 },
      );
    }

    const accounts = await prisma.employeeBankAccount.findMany({
      where: { employeeId: employeeUser.employeeId, deletedAt: null },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id.toString(),
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        accountHolder: a.accountHolder,
      })),
    });
  } catch (error) {
    console.error("Employee bank account fetch error:", error);
    return NextResponse.json(
      { error: "계좌 정보 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getEmployeeUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const employeeUser = await prisma.employeeUser.findUnique({
      where: { id: userId },
      select: { employeeId: true, isActive: true, name: true },
    });

    if (!employeeUser || !employeeUser.isActive) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자입니다." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { accounts } = body as {
      accounts: Array<{
        id?: string;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
      }>;
    };

    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { error: "올바른 요청 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (accounts.length > 3) {
      return NextResponse.json(
        { error: "계좌는 최대 3개까지 등록할 수 있습니다." },
        { status: 400 },
      );
    }

    for (const account of accounts) {
      if (
        !account.bankName?.trim() ||
        !account.accountNumber?.trim() ||
        !account.accountHolder?.trim()
      ) {
        return NextResponse.json(
          { error: "은행명, 계좌번호, 예금주를 모두 입력해 주세요." },
          { status: 400 },
        );
      }
      if (account.accountHolder.trim() !== employeeUser.name) {
        return NextResponse.json(
          { error: "본인 명의의 계좌만 등록할 수 있습니다." },
          { status: 400 },
        );
      }
    }

    const employeeId = employeeUser.employeeId;

    // Get existing account IDs for this employee
    const existingAccounts = await prisma.employeeBankAccount.findMany({
      where: { employeeId, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existingAccounts.map((a) => a.id));

    // Separate into updates and creates
    const toUpdate: Array<{
      id: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }> = [];
    const toCreate: Array<{
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }> = [];
    const incomingIds = new Set<string>();

    for (const account of accounts) {
      if (account.id) {
        let accountId: string;
        try {
          accountId = account.id;
        } catch {
          return NextResponse.json(
            { error: "올바르지 않은 계좌 ID입니다." },
            { status: 400 },
          );
        }
        if (!existingIds.has(accountId)) {
          return NextResponse.json(
            { error: "존재하지 않는 계좌입니다." },
            { status: 400 },
          );
        }
        incomingIds.add(accountId);
        toUpdate.push({
          id: accountId,
          bankName: account.bankName.trim(),
          accountNumber: account.accountNumber.trim(),
          accountHolder: account.accountHolder.trim(),
        });
      } else {
        toCreate.push({
          bankName: account.bankName.trim(),
          accountNumber: account.accountNumber.trim(),
          accountHolder: account.accountHolder.trim(),
        });
      }
    }

    // IDs to soft-delete (existing but not in incoming)
    const toDeleteIds = [...existingIds].filter((id) => !incomingIds.has(id));

    await prisma.$transaction([
      // Soft-delete removed accounts
      ...(toDeleteIds.length > 0
        ? [
            prisma.employeeBankAccount.updateMany({
              where: { id: { in: toDeleteIds }, employeeId },
              data: { deletedAt: new Date() },
            }),
          ]
        : []),
      // Update existing accounts
      ...toUpdate.map((a) =>
        prisma.employeeBankAccount.update({
          where: { id: a.id },
          data: {
            bankName: a.bankName,
            accountNumber: a.accountNumber,
            accountHolder: a.accountHolder,
          },
        }),
      ),
      // Create new accounts
      ...toCreate.map((a) =>
        prisma.employeeBankAccount.create({
          data: {
            employeeId,
            bankName: a.bankName,
            accountNumber: a.accountNumber,
            accountHolder: a.accountHolder,
          },
        }),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee bank account update error:", error);
    return NextResponse.json(
      { error: "계좌 정보 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
