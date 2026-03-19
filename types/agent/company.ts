export type BusinessType = "INDIVIDUAL" | "CORPORATION";

export interface AgentCompanyListItem {
  id: string;
  businessNumber: string;
  businessType: BusinessType;
  businessName: string | null;
  representativeName: string | null;
  openingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCompanyPaginatedResponse {
  items: AgentCompanyListItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
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

// ── 거래처 사용자 초대 ──

export type CompanyUserInviteContactType = "email" | "phone";

export type SendCompanyUserInviteBody = {
  contactType: CompanyUserInviteContactType;
  contact: string;
};

export type SendCompanyUserInviteResponse = {
  message: string;
  /** phone 초대 시 SMS와 함께 운영용으로 확인 가능한 초대 URL */
  inviteUrl?: string;
};

// ── 거래처 사용자 초대 이력 ──

export type CompanyUserInviteHistoryItem = {
  id: string;
  contactType: CompanyUserInviteContactType;
  contact: string;
  role: string;
  inviterName: string;
  inviterEmail: string;
  expiresAt: string;
  isExpired: boolean;
  createdAt: string;
};

export type CompanyUserInviteHistoryResponse = {
  invites: CompanyUserInviteHistoryItem[];
  total: number;
};
