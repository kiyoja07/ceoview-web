import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  EMPLOYEE_SESSION_COOKIE,
  verifyEmployeeSessionToken,
} from "@/app/lib/employee-auth";
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

const EMPLOYEE_LOGIN_PATH = "/employee/auth/login";

export async function getEmployeePortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EMPLOYEE_SESSION_COOKIE)?.value;
  const payload = verifyEmployeeSessionToken(token);

  if (!payload) {
    redirect(EMPLOYEE_LOGIN_PATH);
  }

  let userId: string;
  try {
    userId = payload.userId;
  } catch {
    redirect(EMPLOYEE_LOGIN_PATH);
  }

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
    redirect(EMPLOYEE_LOGIN_PATH);
  }

  return user satisfies EmployeePortalSession;
}
