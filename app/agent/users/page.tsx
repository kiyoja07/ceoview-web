import { redirect } from "next/navigation";

export default function AgentUsersLegacyRedirectPage() {
  redirect("/agent/organization/users");
}
