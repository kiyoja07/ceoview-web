import { redirect } from "next/navigation";

export default async function AgentCompanySalaryUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/agent/salary/new?companyId=${encodeURIComponent(id)}`);
}
