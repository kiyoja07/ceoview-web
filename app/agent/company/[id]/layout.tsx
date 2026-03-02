import type { ReactNode } from "react";
import { CompanyManageTabs } from "./_components/CompanyManageTabs";

export default function AgentCompanyDetailLayout({
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
