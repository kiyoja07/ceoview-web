import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { EmployeeHeader } from "./_components/EmployeeHeader";
import {
  verifyEmployeeSessionToken,
  EMPLOYEE_SESSION_COOKIE,
} from "@/app/lib/employee-auth";
import prisma from "@/app/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(EMPLOYEE_SESSION_COOKIE)?.value;
    const payload = verifyEmployeeSessionToken(token);
    if (!payload) return { title: "직원 포털" };

    const user = await prisma.employeeUser.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        employee: {
          select: {
            company: { select: { businessName: true } },
          },
        },
      },
    });

    const companyName = user?.employee?.company?.businessName;
    return { title: companyName ? `${companyName} 직원 포털` : "직원 포털" };
  } catch {
    return { title: "직원 포털" };
  }
}

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EmployeeHeader />
      {children}
    </>
  );
}
