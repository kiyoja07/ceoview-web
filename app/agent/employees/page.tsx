import { redirect } from "next/navigation";

export default function EmployeeDashboardLegacyRedirectPage() {
  redirect("/agent/company/employees");
}
