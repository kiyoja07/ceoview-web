import { redirect } from "next/navigation";

export default async function AgentCompanyInfoLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/company/${id}/settings/info`);
}
