export type NavItem = {
  href: string;
  label: string;
};

export type HeaderProfile = {
  name: string;
  organization: {
    organizationName: string | null;
    organizationNumber: string;
  } | null;
};
