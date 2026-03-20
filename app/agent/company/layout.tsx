import type { ReactNode } from "react";
import { CompanyModuleTabs } from "./_components/CompanyModuleTabs";

export default function AgentCompanyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CompanyModuleTabs />
      {children}
    </>
  );
}
