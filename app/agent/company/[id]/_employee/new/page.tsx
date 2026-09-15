import { redirect } from "next/navigation";

export default async function AgentCompanyEmployeeNewLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/company/${id}/employees/new`);
}
