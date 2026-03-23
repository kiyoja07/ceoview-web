import type { BusinessType } from "@/types/agent/company";

export type AuthMode = "login" | "signup";

export type AuthResponse = {
  redirectTo?: string;
  message?: string;
  error?: string;
};

export type AuthMessageState = {
  type: "error" | "success";
  text: string;
} | null;

export type AgentAuthMeResponse = {
  id?: string;
  email: string;
  name: string;
  phone?: string | null;
  isMaster?: boolean;
  loginProvider?: string;
  hasOrganization: boolean;
  organization: {
    id?: string;
    organizationNumber: string;
    organizationName: string | null;
    representativeName?: string | null;
  } | null;
};

export type LogoutState = "confirm" | "logging-out" | "success" | "error";

export type LoginBody = {
  email?: string;
};

export type SignupBody = {
  email?: string;
  password?: string;
  name?: string;
  phone?: string | null;
};

export type AgentProfileUpdateBody = {
  name?: string;
  phone?: string | null;
  isMaster?: boolean;
};

export type CreateOrganizationBody = {
  organizationNumber?: string;
  businessType?: BusinessType;
  organizationName?: string | null;
  representativeName?: string | null;
  phone?: string | null;
  openingDate?: string | null;
  zipcode?: string | null;
  address?: string | null;
  addressDetail?: string | null;
  userName?: string;
  userPhone?: string | null;
};

export type ApiErrorResponse = {
  error?: string;
};
