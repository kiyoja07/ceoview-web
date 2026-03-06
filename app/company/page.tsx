"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompanyHomePage() {
  const router = useRouter();

  useEffect(() => {
    const routeBySession = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/company/auth/login");
          return;
        }

        const data = (await res.json()) as { profileComplete?: boolean };
        router.replace(
          data.profileComplete ? "/company/dashboard" : "/company/auth/onboarding",
        );
      } catch {
        router.replace("/company/auth/login");
      }
    };

    void routeBySession();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <p className="text-sm text-gray-500">이동 중...</p>
    </div>
  );
}
