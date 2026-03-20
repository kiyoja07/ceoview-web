import type { ReactNode } from "react";
import { CompanySettingsTabs } from "./_components/CompanySettingsTabs";

export default function AgentCompanySettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CompanySettingsTabs />
      {children}
    </>
  );
}
