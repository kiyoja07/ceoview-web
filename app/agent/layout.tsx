import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AgentHeader } from "./_components/AgentHeader";
import {
  verifyAgentSessionToken,
  AGENT_SESSION_COOKIE,
} from "@/app/lib/agent-auth";
import prisma from "@/app/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AGENT_SESSION_COOKIE)?.value;
    const payload = verifyAgentSessionToken(token);
    if (!payload) return { title: "Agent Console" };

    const user = await prisma.agentUser.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        agentOrganization: {
          select: { organizationName: true },
        },
      },
    });

    const orgName = user?.agentOrganization?.organizationName;
    return { title: orgName || "Agent Console" };
  } catch {
    return { title: "Agent Console" };
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
