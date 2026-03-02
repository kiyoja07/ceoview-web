import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { CompanyHeader } from "./_components/CompanyHeader";
import {
  verifyCompanySessionToken,
  COMPANY_SESSION_COOKIE,
} from "@/app/lib/company-auth";
import prisma from "@/app/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COMPANY_SESSION_COOKIE)?.value;
    const payload = verifyCompanySessionToken(token);
    if (!payload) return { title: "Company Console" };

    const user = await prisma.companyUser.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        company: {
          select: {
            businessName: true,
          },
        },
      },
    });

    const companyName = user?.company?.businessName;
    return { title: companyName || "Company Console" };
  } catch {
    return { title: "Company Console" };
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
