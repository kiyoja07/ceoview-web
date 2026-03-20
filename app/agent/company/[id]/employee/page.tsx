import { redirect } from "next/navigation";

export default async function AgentCompanyEmployeeLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/company/${id}/employees`);
}
