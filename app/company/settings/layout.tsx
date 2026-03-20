import type { ReactNode } from "react";
import { CompanyManageTabs } from "../organization/_components/CompanyManageTabs";

export default function CompanySettingsLayout({
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
