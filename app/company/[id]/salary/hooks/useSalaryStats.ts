import { useEffect, useState } from "react";
import type { SalaryStatsResponse } from "@/types/company/salary";

interface UseSalaryStatsParams {
  companyId: string;
  months?: number;
  enabled?: boolean;
}

interface UseSalaryStatsResult {
  data: SalaryStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useSalaryStats({
  companyId,
  months = 12,
  enabled = true,
}: UseSalaryStatsParams): UseSalaryStatsResult {
  const [data, setData] = useState<SalaryStatsResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // 조회 조건이 바뀌면 렌더 중에 로딩·오류 상태를 초기화
  const requestKey = enabled ? `${companyId}|${months}` : null;
  const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
  if (requestKey !== prevRequestKey) {
    setPrevRequestKey(requestKey);
    setLoading(requestKey !== null);
    setError(null);
  }

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/company/${companyId}/salary-stats?months=${months}`,
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "통계를 불러오는 데 실패했습니다.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [companyId, months, enabled]);

  return { data, loading, error };
}
