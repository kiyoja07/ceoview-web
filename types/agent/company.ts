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
