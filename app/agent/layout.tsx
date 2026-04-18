import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { AgentHeader } from "./_components/AgentHeader";
import {
  verifyAgentSessionToken,
  AGENT_SESSION_COOKIE,
} from "@/app/lib/agent-auth";
import prisma from "@/app/lib/prisma";

async function shouldShowAgentHeader() {
  const headerStore = await headers();
  const pathname = headerStore.get("x-ceoview-pathname") ?? "";
  return !pathname.startsWith("/agent/auth");
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    if (!(await shouldShowAgentHeader())) {
      return { title: "세무대리인 로그인" };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AGENT_SESSION_COOKIE)?.value;
    const payload = verifyAgentSessionToken(token);
    if (!payload) return { title: "세무대리인 대시보드" };

    const user = await prisma.agentUser.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        agentOrganization: {
          select: { organizationName: true },
        },
      },
    });

    const orgName = user?.agentOrganization?.organizationName;
    return { title: orgName || "세무대리인 대시보드" };
  } catch {
    return { title: "세무대리인 대시보드" };
  }
}

export default async function AgentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const showHeader = await shouldShowAgentHeader();

  return (
    <>
      {showHeader ? <AgentHeader /> : null}
      {children}
    </>
  );
}
