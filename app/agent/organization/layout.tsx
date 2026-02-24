import type { ReactNode } from "react";
import { OrganizationManageTabs } from "./_components/OrganizationManageTabs";

export default function AgentOrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <OrganizationManageTabs />
      {children}
    </>
  );
}
