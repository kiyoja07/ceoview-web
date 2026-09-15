import { redirect } from "next/navigation";

export default async function AgentCompanyEmployeeDetailLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string; employeeId: string }>;
}) {
  const { id, employeeId } = await params;
  redirect(`/agent/company/${id}/employees/${employeeId}`);
}
