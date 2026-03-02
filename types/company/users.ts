export type CompanyUserItem = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isMaster: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanyUsersResponse = {
  currentUserId: string;
  canManageUsers: boolean;
  company: {
    id: string;
    businessNumber: string;
    businessType: "INDIVIDUAL" | "CORPORATION";
    businessName: string | null;
    representativeName: string | null;
  };
  summary: {
    total: number;
    active: number;
    masters: number;
  };
  users: CompanyUserItem[];
};

export type CompanyUsersUpdateBody = {
  userId?: string;
  isActive?: boolean;
};

export type CompanyInviteContactType = "email" | "phone";

export type SendCompanyUserInviteBody = {
  contactType?: CompanyInviteContactType;
  contact?: string;
};

export type SendCompanyUserInviteResponse = {
  message: string;
  inviteUrl?: string;
};

export type CompanyInfoResponse = {
  canManageCompanyInfo: boolean;
  company: {
    id: string;
    businessNumber: string;
    businessType: "INDIVIDUAL" | "CORPORATION";
    businessName: string | null;
    representativeName: string | null;
    openingDate: string | null;
    address: string | null;
  };
};

export type CompanyInfoUpdateBody = {
  businessType?: "INDIVIDUAL" | "CORPORATION";
  businessName?: string | null;
  representativeName?: string | null;
  openingDate?: string | null;
  address?: string | null;
};
