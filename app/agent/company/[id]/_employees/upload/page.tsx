import { redirect } from "next/navigation";

export default async function AgentCompanyEmployeesUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/employees/new?companyId=${encodeURIComponent(id)}`);
}
