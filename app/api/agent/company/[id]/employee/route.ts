import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { userId, organizationId: user.agentOrganizationId } as const;
}

function parseCompanyId(id: string) {
  try {
    return { companyId: id } as const;
  } catch {
    return { error: "유효한 거래처 ID가 아닙니다." } as const;
  }
}

async function ensureCompanyAccess(companyId: string, organizationId: string) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      organizationLink: { is: { agentOrganizationId: organizationId } },
    },
    select: { id: true },
  });
  return Boolean(company);
}

// GET: 직원 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hasAccess = await ensureCompanyAccess(
      parsed.companyId,
      auth.organizationId,
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "50")),
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const incomeType =
      searchParams.get("incomeType")?.trim() || "EARNED_INCOME";

    // ── 근로소득자 (Employee) ──
    if (incomeType === "EARNED_INCOME") {
      const where = {
        companyId: parsed.companyId,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { employeeCode: { contains: search } },
                { department: { contains: search } },
              ],
            }
          : {}),
      };

      const [total, employees] = await Promise.all([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
          where,
          select: {
            id: true,
            employeeCode: true,
            name: true,
            residentNumber: true,
            department: true,
            positionTitle: true,
            hireDate: true,
            resignDate: true,
            phone: true,
            email: true,
            publishStatus: true,
            createdAt: true,
            bankAccounts: {
              where: { deletedAt: null },
              select: {
                bankName: true,
                accountNumber: true,
                accountHolder: true,
              },
              take: 1,
            },
          },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const serialized = employees.map((emp) => ({
        id: emp.id.toString(),
        employeeCode: emp.employeeCode,
        name: emp.name,
        residentNumber: emp.residentNumber,
        department: emp.department,
        positionTitle: emp.positionTitle,
        hireDate: emp.hireDate,
        resignDate: emp.resignDate,
        phone: emp.phone,
        email: emp.email,
        publishStatus: emp.publishStatus ?? "SAVED",
        createdAt: emp.createdAt.toISOString(),
        bankAccount: emp.bankAccounts[0] ?? null,
      }));

      return NextResponse.json({
        success: true,
        employees: serialized,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // ── 사업소득자 / 기타소득자 / 일용소득자 (더미 모델) ──
    const modelMap = {
      BUSINESS_INCOME: prisma.businessIncomeEmployee,
      OTHER_INCOME: prisma.otherIncomeEmployee,
      OTHER_INCOME_LABOR: prisma.otherIncomeLaborEmployee,
    } as const;

    const model = modelMap[incomeType as keyof typeof modelMap];
    if (!model) {
      return NextResponse.json(
        { error: "유효하지 않은 소득 유형입니다." },
        { status: 400 },
      );
    }

    const where = {
      companyId: parsed.companyId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { employeeCode: { contains: search } },
              { department: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      (model as typeof prisma.businessIncomeEmployee).count({ where }),
      (model as typeof prisma.businessIncomeEmployee).findMany({
        where,
        select: {
          id: true,
          employeeCode: true,
          name: true,
          residentNumber: true,
          department: true,
          positionTitle: true,
          hireDate: true,
          resignDate: true,
          phone: true,
          email: true,
          publishStatus: true,
          createdAt: true,
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const serialized = rows.map((emp) => ({
      id: emp.id.toString(),
      employeeCode: emp.employeeCode,
      name: emp.name,
      residentNumber: emp.residentNumber,
      department: emp.department,
      positionTitle: emp.positionTitle,
      hireDate: emp.hireDate,
      resignDate: emp.resignDate,
      phone: emp.phone,
      email: emp.email,
      publishStatus: emp.publishStatus ?? "SAVED",
      createdAt: emp.createdAt.toISOString(),
      bankAccount: null,
    }));

    return NextResponse.json({
      success: true,
      employees: serialized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Agent employee GET error:", error);
    return NextResponse.json(
      { error: "직원 목록을 조회하지 못했습니다." },
      { status: 500 },
    );
  }
}

// DELETE: 직원 소프트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const parsed = parseCompanyId(id);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const hasAccess = await ensureCompanyAccess(
      parsed.companyId,
      auth.organizationId,
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "접근 가능한 거래처를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const employeeIdRaw =
      body && typeof body.employeeId === "string" ? body.employeeId.trim() : "";
    const requestIdRaw =
      body && typeof body.requestId === "string" ? body.requestId.trim() : "";

    if (!employeeIdRaw) {
      return NextResponse.json(
        { error: "삭제할 직원을 선택해주세요." },
        { status: 400 },
      );
    }

    let employeeId: string;
    try {
      employeeId = employeeIdRaw;
    } catch {
      return NextResponse.json(
        { error: "유효한 직원 ID가 아닙니다." },
        { status: 400 },
      );
    }

    let requestId: string | null = null;
    if (requestIdRaw) {
      try {
        requestId = requestIdRaw;
      } catch {
        return NextResponse.json(
          { error: "유효한 요청 ID가 아닙니다." },
          { status: 400 },
        );
      }
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: parsed.companyId,
        deletedAt: null,
      },
      select: { id: true, publishStatus: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "해당 직원을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (employee.publishStatus === "PUBLISHED") {
      return NextResponse.json(
        {
          error:
            "공개 상태인 직원은 삭제할 수 없습니다. 비공개로 변경 후 삭제해주세요.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (requestId) {
        const changeRequest = await tx.companyChangeRequest.findFirst({
          where: {
            id: requestId,
            companyId: parsed.companyId,
            targetEmployeeId: employeeId,
            scope: "EMPLOYEE",
            action: "DELETE",
            status: "PENDING",
            company: {
              organizationLink: {
                is: { agentOrganizationId: auth.organizationId },
              },
            },
          },
          select: { id: true },
        });

        if (!changeRequest) {
          throw new Error("REQUEST_NOT_FOUND");
        }
      }

      const deletedAt = new Date();

      await tx.employeeBankAccount.updateMany({
        where: { employeeId, deletedAt: null },
        data: { deletedAt },
      });

      await tx.employee.update({
        where: { id: employee.id },
        data: { deletedAt },
      });

      if (requestId) {
        await tx.companyChangeRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            resolvedAt: new Date(),
            resolvedByAgentUserId: auth.userId,
            resolutionComment: null,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agent employee DELETE error:", error);
    if (error instanceof Error && error.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { error: "처리 가능한 요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "직원 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
