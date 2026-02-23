import type { ReactNode } from "react";
import { AgentHeader } from "./_components/AgentHeader";

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AgentHeader />
      {children}
    </>
  );
}
