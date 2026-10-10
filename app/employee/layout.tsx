import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EmployeeHeader } from "./_components/EmployeeHeader";
import { backendGet } from "@/app/lib/backend";
import type { EmployeeAuthMeResponse } from "@/types/employee/auth";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const me = await backendGet<EmployeeAuthMeResponse>("/api/employee/auth/me");
    const companyName = me.ok ? me.data.company.businessName : null;
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
