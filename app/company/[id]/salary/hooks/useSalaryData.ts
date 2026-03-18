import { useCallback, useEffect, useState } from "react";
import type {
  BusinessApiResponse,
  DailyApiResponse,
  EarnedApiResponse,
  IncomeTab,
  OtherApiResponse,
  ViewMode,
} from "../types";

interface UseSalaryDataParams {
  companyId: string;
  currentPage: number;
  filterAccrualYm: string;
  filterPaymentYm: string;
  viewMode: ViewMode;
}

interface UseSalaryDataResult {
  earnedData: EarnedApiResponse | null;
  businessData: BusinessApiResponse | null;
  dailyData: DailyApiResponse | null;
  otherData: OtherApiResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSalaryData({
  companyId,
  currentPage,
  filterAccrualYm,
  filterPaymentYm,
  viewMode,
}: UseSalaryDataParams): UseSalaryDataResult {
  const [earnedData, setEarnedData] = useState<EarnedApiResponse | null>(null);
  const [businessData, setBusinessData] = useState<BusinessApiResponse | null>(
    null,
  );
  const [dailyData, setDailyData] = useState<DailyApiResponse | null>(null);
  const [otherData, setOtherData] = useState<OtherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("size", "50");
      if (filterAccrualYm) params.set("accrualYm", filterAccrualYm);
      if (filterPaymentYm) params.set("paymentYm", filterPaymentYm);

      if (viewMode === "dashboard") {
        const endpoints = {
          earned: `/api/company/${companyId}/earned-income?${params}`,
          business: `/api/company/${companyId}/business-income?${params}`,
          daily: `/api/company/${companyId}/daily-income-labor?${params}`,
          other: `/api/company/${companyId}/other-income?${params}`,
        };

        const [earnedRes, businessRes, dailyRes, otherRes] = await Promise.all([
          fetch(endpoints.earned),
          fetch(endpoints.business),
          fetch(endpoints.daily),
          fetch(endpoints.other),
        ]);

        if (earnedRes.ok) setEarnedData(await earnedRes.json());
        else setEarnedData(null);

        if (businessRes.ok) setBusinessData(await businessRes.json());
        else setBusinessData(null);

        if (dailyRes.ok) setDailyData(await dailyRes.json());
        else setDailyData(null);

        if (otherRes.ok) setOtherData(await otherRes.json());
        else setOtherData(null);

        return;
      }

      const endpointMap: Record<IncomeTab, string> = {
        earned: `/api/company/${companyId}/earned-income?${params}`,
        business: `/api/company/${companyId}/business-income?${params}`,
        daily: `/api/company/${companyId}/daily-income-labor?${params}`,
        other: `/api/company/${companyId}/other-income?${params}`,
      };

      const endpoint = endpointMap[viewMode];
      const res = await fetch(endpoint);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      if (viewMode === "business") {
        setBusinessData(await res.json());
      } else if (viewMode === "daily") {
        setDailyData(await res.json());
      } else if (viewMode === "other") {
        setOtherData(await res.json());
      } else {
        setEarnedData(await res.json());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage, filterAccrualYm, filterPaymentYm, viewMode]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    earnedData,
    businessData,
    dailyData,
    otherData,
    loading,
    error,
    refetch: fetchData,
  };
}
