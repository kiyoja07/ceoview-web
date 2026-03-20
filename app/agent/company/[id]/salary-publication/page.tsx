import { redirect } from "next/navigation";

export default async function AgentCompanySalaryPublicationLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/company/${id}/salary`);
}
