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

// 인건비/직원 기능 경로 : /company/salary, /company/employees, /company/{id}/salary
const SALARY_PATH_RE = /^\/company\/(salary|employees)(\/|$)|^\/company\/[^/]+\/salary(\/|$)/;
// 재무리포트 기능 경로 : /company/financial-report, /company/{id}/financial-report
const FINANCIAL_REPORT_PATH_RE =
  /^\/company\/financial-report(\/|$)|^\/company\/[^/]+\/financial-report(\/|$)/;

function isFeatureRestrictedPath(
  pathname: string,
  features: { salary: boolean; financialReport: boolean },
) {
  if (!features.salary && SALARY_PATH_RE.test(pathname)) return true;
  if (!features.financialReport && FINANCIAL_REPORT_PATH_RE.test(pathname)) {
    return true;
  }
  return false;
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

      // 에이전트가 끈 기능의 경로는 접근을 차단한다.
      if (access && isFeatureRestrictedPath(pathname, access.company.features)) {
        redirect("/company/dashboard");
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
