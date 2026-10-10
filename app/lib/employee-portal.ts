import prisma from "@/app/lib/prisma";

export type EmployeePortalSession = {
  id: string;
  employeeId: string;
  name: string;
  email: string | null;
  phone: string | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
  isActive: boolean;
  employee: {
    id: string;
    employeeCode: string | null;
    residentNumber: string | null;
    department: string | null;
    positionTitle: string | null;
    deletedAt: Date | null;
    company: {
      id: string;
      businessName: string | null;
      businessNumber: string;
    };
  };
};

// 활성 직원 계정과 소속 회사를 조회한다. 비활성·삭제된 직원이면 null.
export async function loadEmployeePortalSession(
  userId: string,
): Promise<EmployeePortalSession | null> {
  const user = await prisma.employeeUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      employeeId: true,
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
          residentNumber: true,
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
    return null;
  }

  return user;
}
