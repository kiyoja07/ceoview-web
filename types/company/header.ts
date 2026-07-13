import type { CompanyFeatureFlags } from "@/types/company/features";

export type CompanyHeaderProfile = {
  name: string;
  email: string;
  features: CompanyFeatureFlags;
  company: {
    id: string;
    businessName: string | null;
    businessNumber: string;
  } | null;
};

export type CompanyHeaderNavItem = {
  href: string;
  label: string;
};
