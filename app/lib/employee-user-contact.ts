import prisma from "@/app/lib/prisma";

/**
 * 직원 계정(EmployeeUser)의 이메일·전화 중복 확인.
 * email·phone은 비어 있을 수 있어 DB 고유 제약 대신 여기서 중복을 확인한다.
 * 비어 있는 값은 확인하지 않는다.
 */
export async function findEmployeeUserContactConflict(params: {
  email?: string | null;
  phone?: string | null;
  excludeUserId?: string | null;
  excludeEmployeeId?: string | null;
}): Promise<"email" | "phone" | null> {
  const exclude = [
    params.excludeUserId ? { id: params.excludeUserId } : null,
    params.excludeEmployeeId ? { employeeId: params.excludeEmployeeId } : null,
  ].filter((value): value is { id: string } | { employeeId: string } =>
    Boolean(value),
  );
  const notClause = exclude.length > 0 ? { NOT: exclude } : {};

  if (params.email) {
    const existing = await prisma.employeeUser.findFirst({
      where: { email: params.email, ...notClause },
      select: { id: true },
    });
    if (existing) return "email";
  }

  if (params.phone) {
    const existing = await prisma.employeeUser.findFirst({
      where: { phone: params.phone, ...notClause },
      select: { id: true },
    });
    if (existing) return "phone";
  }

  return null;
}
