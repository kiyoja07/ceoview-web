export type CompanyHeaderProfile = {
  name: string;
  email: string;
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
