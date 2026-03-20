import { redirect } from "next/navigation";

export default function SalaryDashboardLegacyRedirectPage() {
  redirect("/agent/company/salary");
}
