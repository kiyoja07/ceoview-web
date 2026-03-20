import { redirect } from "next/navigation";

export default async function AgentCompanyEmployeePublicationLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/company/${id}/employees`);
}
