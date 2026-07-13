export type CompanyAuthMessageState = {
  type: "error" | "success";
  text: string;
} | null;

export type CompanyAuthResponse = {
  status?: "pending_join_request";
  requestId?: string;
  redirectTo?: string;
  message?: string;
  error?: string;
};

export type CompanyAuthMeResponse = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isMaster: boolean;
  loginProvider: string;
  hasCompany: boolean;
  profileComplete: boolean;
  pendingJoinRequest: CompanyPendingJoinRequestSummary | null;
  currentCompanyId: string | null;
  company: CompanyAuthCompanySummary | null;
  companies: CompanyAuthCompanySummary[];
};

export type CompanyAuthCompanySummary = {
  id: string;
  businessNumber: string;
  businessType: "INDIVIDUAL" | "CORPORATION";
  businessName: string | null;
  representativeName: string | null;
};

export type CompanyPendingJoinRequestSummary = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  company: {
    id: string;
    businessNumber: string;
    businessName: string | null;
  };
};

export type CompanyLoginBody = {
  contactType?: "email" | "phone";
  contact?: string;
  email?: string;
  phone?: string;
};

export type CompanySignupBody = {
  email?: string;
  password?: string;
  name?: string;
  phone?: string | null;
  businessNumber?: string;
  businessType?: "INDIVIDUAL" | "CORPORATION";
  businessName?: string | null;
  representativeName?: string | null;
  openingDate?: string | null;
  address?: string | null;
};

export type CompanyOnboardingBody = {
  name?: string;
  phone?: string | null;
  businessNumber?: string;
  businessType?: "INDIVIDUAL" | "CORPORATION";
  businessName?: string | null;
  representativeName?: string | null;
  openingDate?: string | null;
  address?: string | null;
};

export type CompanyApiErrorResponse = {
  error?: string;
  code?: string;
};

export type CompanyLogoutState =
  | "confirm"
  | "logging-out"
  | "success"
  | "error";

export type CompanyProfileUpdateBody = {
  name?: string;
  phone?: string | null;
  phoneVerificationId?: string;
  isMaster?: boolean;
};
