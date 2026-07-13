import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CompanyHeader } from "./_components/CompanyHeader";
import {
  COMPANY_SELECTED_COMPANY_COOKIE,
  verifyCompanySessionToken,
  COMPANY_SESSION_COOKIE,
} from "@/app/lib/company-auth";
import { resolveCompanyAccessContextForUser } from "@/app/lib/company-access";
import { COMPANY_ONBOARDING_PENDING_MARKER } from "@/app/lib/company-onboarding";
import prisma from "@/app/lib/prisma";

async function shouldShowCompanyHeader() {
  const headerStore = await headers();
  const pathname = headerStore.get("x-ceoview-pathname") ?? "";
  return !pathname.startsWith("/company/auth");
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    if (!(await shouldShowCompanyHeader())) {
      return { title: "Company Auth" };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(COMPANY_SESSION_COOKIE)?.value;
    const selectedCompanyValue =
      cookieStore.get(COMPANY_SELECTED_COMPANY_COOKIE)?.value ?? null;
    const payload = verifyCompanySessionToken(token);
    if (!payload) return { title: "Company Dashboard" };

    const selectedCompanyId = selectedCompanyValue
      ? selectedCompanyValue
      : null;
    const access = await resolveCompanyAccessContextForUser({
      userId: payload.userId,
      selectedCompanyId,
    });

    const companyName = access?.company.businessName;
    return { title: companyName || "Company Dashboard" };
  } catch {
    return { title: "Company Dashboard" };
  }
}

export default async function CompanyLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-ceoview-pathname") ?? "";

  if (!pathname.startsWith("/company/auth")) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COMPANY_SESSION_COOKIE)?.value;
    const selectedCompanyValue =
      cookieStore.get(COMPANY_SELECTED_COMPANY_COOKIE)?.value ?? null;
    const payload = verifyCompanySessionToken(token);

    if (payload) {
      const access = await resolveCompanyAccessContextForUser({
        userId: payload.userId,
        selectedCompanyId: selectedCompanyValue,
      });

      if (access?.company.address === COMPANY_ONBOARDING_PENDING_MARKER) {
        const pendingRequest = await prisma.companyJoinRequest.findFirst({
          where: {
            companyUserId: payload.userId,
            status: "PENDING",
          },
          select: { id: true },
        });

        redirect(
          pendingRequest ? "/company/auth/pending" : "/company/auth/onboarding",
        );
      }
    }
  }

  return (
    <>
      <CompanyHeader />
      {children}
    </>
  );
}
