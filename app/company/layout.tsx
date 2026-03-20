import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { CompanyHeader } from "./_components/CompanyHeader";
import {
  COMPANY_SELECTED_COMPANY_COOKIE,
  verifyCompanySessionToken,
  COMPANY_SESSION_COOKIE,
} from "@/app/lib/company-auth";
import { resolveCompanyAccessContextForUser } from "@/app/lib/company-access";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COMPANY_SESSION_COOKIE)?.value;
    const selectedCompanyValue =
      cookieStore.get(COMPANY_SELECTED_COMPANY_COOKIE)?.value ?? null;
    const payload = verifyCompanySessionToken(token);
    if (!payload) return { title: "Company Dashboard" };

    const selectedCompanyId = selectedCompanyValue
      ? BigInt(selectedCompanyValue)
      : null;
    const access = await resolveCompanyAccessContextForUser({
      userId: BigInt(payload.userId),
      selectedCompanyId,
    });

    const companyName = access?.company.businessName;
    return { title: companyName || "Company Dashboard" };
  } catch {
    return { title: "Company Dashboard" };
  }
}

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CompanyHeader />
      {children}
    </>
  );
}
