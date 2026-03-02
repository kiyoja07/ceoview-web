"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BizStatusData } from "./shared";

/**
 * 국세청 사업자등록 상태조회 API 호출을 공유하는 훅.
 * company/new, auth/organization 등에서 동일하게 사용.
 */
export default function useBizValidation() {
  const router = useRouter();

  const validate = useCallback(
    async (businessNumber: string): Promise<BizStatusData | null> => {
      const res = await fetch("/api/agent/company/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber }),
      });

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return null;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "조회에 실패했습니다.");
      }

      return (await res.json()) as BizStatusData;
    },
    [router],
  );

  return validate;
}
