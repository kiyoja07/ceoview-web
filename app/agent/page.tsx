"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AgentAuthMeResponse } from "@/types/agent/auth";

export default function AgentHomePage() {
  const router = useRouter();

  useEffect(() => {
    const routeBySession = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/agent/auth/login");
          return;
        }

        const data = (await res.json()) as Pick<
          AgentAuthMeResponse,
          "hasOrganization"
        >;
        router.replace(data.hasOrganization ? "/agent/company" : "/agent/auth/organization");
      } catch {
        router.replace("/agent/auth/login");
      }
    };

    void routeBySession();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <p className="text-sm text-gray-500">이동 중...</p>
    </div>
  );
}
