import { redirect } from "next/navigation";

export default function CompanyOrganizationLegacyRedirectPage() {
  redirect("/company/settings/profile");
}
