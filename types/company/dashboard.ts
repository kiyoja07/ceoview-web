export type CompanyDashboardIncomeKey =
  | "earned"
  | "business"
  | "daily"
  | "other";

export type CompanyDashboardPublication = {
  publishStatus: "NONE" | "SAVED" | "PUBLISHED";
  isAgentView: boolean;
  companyVisible: boolean;
  uploadedAt: string | null;
};

export type CompanyDashboardSalaryMonth = {
  ym: number;
  label: string;
  totalPayment: number;
  netPayment: number;
  totalCount: number;
};

export type CompanyDashboardResponse = {
  company: {
    id: string;
    businessName: string | null;
    businessNumber: string;
  };
  agentOrganization: {
    id: string;
    organizationName: string | null;
    organizationNumber: string;
    representativeName: string | null;
    phone: string | null;
  } | null;
  salary: {
    hasData: boolean;
    latestYm: number | null;
    latestLabel: string | null;
    totalPayment: number;
    netPayment: number;
    totalCount: number;
    publicationByType: Record<
      CompanyDashboardIncomeKey,
      CompanyDashboardPublication
    >;
    recentMonths: CompanyDashboardSalaryMonth[];
  };
  employees: {
    total: number;
    active: number;
    upcoming: number;
    leaving: number;
    inactive: number;
    noHireDate: number;
    withContact: number;
    withEmail: number;
    withBankAccount: number;
    recentJoined: number;
    earnedCount: number;
    businessCount: number;
    otherCount: number;
    dailyCount: number;
  };
};
