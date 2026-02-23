export type UserType = "AGENT" | "COMPANY";

export type UpdateBody = {
  userType?: UserType;
  userId?: string;
  isActive?: boolean;
};

export type AgentUserItem = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isMaster: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanyUserItem = {
  id: string;
  companyId: string;
  email: string;
  name: string;
  phone: string | null;
  isMaster: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company: {
    businessNumber: string;
    businessName: string | null;
    representativeName: string | null;
  };
};

export type UsersResponse = {
  currentUserId: string;
  summary: {
    agentUsers: { total: number; active: number; masters: number };
    companyUsers: { total: number; active: number; masters: number };
  };
  agentUsers: AgentUserItem[];
  companyUsers: CompanyUserItem[];
};

export type UsersMessageState = {
  type: "success" | "error";
  text: string;
} | null;
