import { redirect } from "next/navigation";

export default async function CompanyOrganizationEmployeesDetailLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/company/employees/${id}`);
}
