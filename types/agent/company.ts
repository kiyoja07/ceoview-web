export type BusinessType = "INDIVIDUAL" | "CORPORATION";

export interface AgentCompanyListItem {
  id: string;
  businessNumber: string;
  businessType: BusinessType;
  businessName: string | null;
  representativeName: string | null;
  openingDate: string | null;
  createdAt: string;
}

export type AgentCompanyUserItem = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isMaster: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AgentCompanyUsersResponse = {
  company: {
    id: string;
    businessNumber: string;
    businessName: string | null;
    businessType: BusinessType;
    representativeName: string | null;
  };
  summary: {
    total: number;
    active: number;
    masters: number;
  };
  users: AgentCompanyUserItem[];
};
