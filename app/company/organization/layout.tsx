import type { ReactNode } from "react";
import { CompanyManageTabs } from "./_components/CompanyManageTabs";

export default function CompanyOrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CompanyManageTabs />
      {children}
    </>
  );
}
