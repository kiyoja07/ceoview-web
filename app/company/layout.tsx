import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CompanyHeader } from "./_components/CompanyHeader";
import { backendGet } from "@/app/lib/backend";
import type { CompanySessionResponse } from "@/types/company/session";

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

function getCompanySession() {
  return backendGet<CompanySessionResponse>("/api/company/session");
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    if (!(await shouldShowCompanyHeader())) {
      return { title: "Company Auth" };
    }

    const session = await getCompanySession();
    if (!session.ok || !session.data.authenticated) {
      return { title: "Company Dashboard" };
    }

    const companyName = session.data.company?.businessName;
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
    const session = await getCompanySession();

    if (session.ok && session.data.authenticated) {
      const { company, onboarding } = session.data;

      if (onboarding) {
        redirect(
          onboarding === "pending"
            ? "/company/auth/pending"
            : "/company/auth/onboarding",
        );
      }

      // 에이전트가 끈 기능의 경로는 접근을 차단한다.
      if (company && isFeatureRestrictedPath(pathname, company.features)) {
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
