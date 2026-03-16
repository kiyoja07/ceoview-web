import type { BusinessType } from "@/types/agent/company";

export type AgentOrganizationInfoResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    isMaster: boolean;
  };
  organization: {
    id: string;
    organizationNumber: string;
    businessType: BusinessType;
    organizationName: string | null;
    representativeName: string | null;
    openingDate: string | null;
    zipcode: string | null;
    address: string | null;
    addressDetail: string | null;
  };
};
