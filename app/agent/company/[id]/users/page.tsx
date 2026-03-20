import { redirect } from "next/navigation";

export default async function AgentCompanyUsersLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/company/${id}/settings/users`);
}
