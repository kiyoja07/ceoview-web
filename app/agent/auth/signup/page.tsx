import { redirect } from "next/navigation";

export default function AgentSignupLegacyPage() {
  redirect("/agent/auth/login");
}
