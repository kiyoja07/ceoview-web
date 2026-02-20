import { useCallback, useEffect, useState } from "react";
import type { SalaryStatsResponse } from "../types";

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

  const fetchStats = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/company/${companyId}/salary-stats?months=${months}`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setData(await res.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "통계를 불러오는 데 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId, months, enabled]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error };
}
