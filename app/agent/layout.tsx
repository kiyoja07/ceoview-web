import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AgentHeader } from "./_components/AgentHeader";
import { backendGet } from "@/app/lib/backend";
import type { AgentSessionResponse } from "@/types/agent/session";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const session = await backendGet<AgentSessionResponse>("/api/agent/session");
    if (!session.ok || !session.data.authenticated) {
      return { title: "세무대리인 로그인" };
    }
    return { title: session.data.organizationName || "세무대리인 대시보드" };
  } catch {
    return { title: "세무대리인 대시보드" };
  }
}

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AgentHeader />
      {children}
    </>
  );
}
