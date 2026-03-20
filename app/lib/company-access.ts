import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import {
  getCompanyUserIdFromRequest,
  getSelectedCompanyIdFromRequest,
} from "@/app/lib/company-auth";

const companyAccessSelect = {
  id: true,
  businessNumber: true,
  businessType: true,
  businessName: true,
  representativeName: true,
  openingDate: true,
  zipcode: true,
  address: true,
  addressDetail: true,
} as const;

export type CompanyAccessCompany = {
  id: bigint;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
  openingDate: Date | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
};

export type CompanyAccessContext = {
  userId: bigint;
  isMaster: boolean;
  primaryCompanyId: bigint;
  currentCompanyId: bigint;
  company: CompanyAccessCompany;
  companies: CompanyAccessCompany[];
};

function mergeCompanies(companies: CompanyAccessCompany[]) {
  const merged = new Map<string, CompanyAccessCompany>();
  for (const company of companies) {
    merged.set(company.id.toString(), company);
  }
  return Array.from(merged.values());
}

function resolveCurrentCompanyId(
  companies: CompanyAccessCompany[],
  primaryCompanyId: bigint,
  selectedCompanyId?: bigint | null,
) {
  if (
    selectedCompanyId &&
    companies.some((company) => company.id === selectedCompanyId)
  ) {
    return selectedCompanyId;
  }

  if (companies.some((company) => company.id === primaryCompanyId)) {
    return primaryCompanyId;
  }

  return companies[0]?.id ?? null;
}

export async function resolveCompanyAccessContextForUser(params: {
  userId: bigint;
  selectedCompanyId?: bigint | null;
}): Promise<CompanyAccessContext | null> {
  const user = await prisma.companyUser.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      isActive: true,
      isMaster: true,
      companyId: true,
      company: {
        select: companyAccessSelect,
      },
      companyMemberships: {
        select: {
          company: {
            select: companyAccessSelect,
          },
        },
      },
    },
  });

  if (!user || !user.isActive || !user.company) {
    return null;
  }

  const companies = mergeCompanies([
    user.company,
    ...user.companyMemberships.map((membership) => membership.company),
  ]);
  const currentCompanyId = resolveCurrentCompanyId(
    companies,
    user.companyId,
    params.selectedCompanyId,
  );

  if (!currentCompanyId) {
    return null;
  }

  const currentCompany =
    companies.find((company) => company.id === currentCompanyId) ?? null;
  if (!currentCompany) {
    return null;
  }

  return {
    userId: user.id,
    isMaster: user.isMaster,
    primaryCompanyId: user.companyId,
    currentCompanyId,
    company: currentCompany,
    companies,
  };
}

export async function resolveCompanyAccessContext(request: NextRequest) {
  const userId = getCompanyUserIdFromRequest(request);
  if (!userId) {
    return null;
  }

  return resolveCompanyAccessContextForUser({
    userId,
    selectedCompanyId: getSelectedCompanyIdFromRequest(request),
  });
}

export function buildCompanyUserScope(companyId: bigint) {
  return {
    OR: [
      { companyId },
      {
        companyMemberships: {
          some: {
            companyId,
          },
        },
      },
    ],
  };
}
