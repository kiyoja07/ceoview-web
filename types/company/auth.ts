export type CompanyAuthMessageState = {
  type: "error" | "success";
  text: string;
} | null;

export type CompanyAuthResponse = {
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
  company: {
    id: string;
    businessNumber: string;
    businessType: "INDIVIDUAL" | "CORPORATION";
    businessName: string | null;
    representativeName: string | null;
  } | null;
};

export type CompanyLoginBody = {
  email?: string;
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

export type CompanyApiErrorResponse = {
  error?: string;
  code?: string;
};

export type CompanyLogoutState = "confirm" | "logging-out" | "success" | "error";
