import { redirect } from "next/navigation";

export default function CompanyOrganizationUsersLegacyRedirectPage() {
  redirect("/company/settings/users");
}
