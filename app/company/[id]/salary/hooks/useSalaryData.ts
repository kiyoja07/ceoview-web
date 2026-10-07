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

type SalaryDataQuery = {
  companyId: string;
  currentPage: number;
  filterAccrualYm: string;
  filterPaymentYm: string;
  viewMode: ViewMode;
};

type SalaryDataResult =
  | {
      kind: "dashboard";
      earned: EarnedApiResponse | null;
      business: BusinessApiResponse | null;
      daily: DailyApiResponse | null;
      other: OtherApiResponse | null;
    }
  | { kind: "earned"; data: EarnedApiResponse }
  | { kind: "business"; data: BusinessApiResponse }
  | { kind: "daily"; data: DailyApiResponse }
  | { kind: "other"; data: OtherApiResponse }
  | { kind: "error"; message: string };

async function fetchSalaryData({
  companyId,
  currentPage,
  filterAccrualYm,
  filterPaymentYm,
  viewMode,
}: SalaryDataQuery): Promise<SalaryDataResult> {
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

      return {
        kind: "dashboard",
        earned: earnedRes.ok ? await earnedRes.json() : null,
        business: businessRes.ok ? await businessRes.json() : null,
        daily: dailyRes.ok ? await dailyRes.json() : null,
        other: otherRes.ok ? await otherRes.json() : null,
      };
    }

    const endpointMap: Record<IncomeTab, string> = {
      earned: `/api/company/${companyId}/earned-income?${params}`,
      business: `/api/company/${companyId}/business-income?${params}`,
      daily: `/api/company/${companyId}/daily-income-labor?${params}`,
      other: `/api/company/${companyId}/other-income?${params}`,
    };

    const res = await fetch(endpointMap[viewMode]);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }

    return { kind: viewMode, data: await res.json() } as SalaryDataResult;
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "데이터를 불러올 수 없습니다.",
    };
  }
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

  const applyResult = useCallback((result: SalaryDataResult) => {
    switch (result.kind) {
      case "dashboard":
        setEarnedData(result.earned);
        setBusinessData(result.business);
        setDailyData(result.daily);
        setOtherData(result.other);
        break;
      case "earned":
        setEarnedData(result.data);
        break;
      case "business":
        setBusinessData(result.data);
        break;
      case "daily":
        setDailyData(result.data);
        break;
      case "other":
        setOtherData(result.data);
        break;
      case "error":
        setError(result.message);
        break;
    }
    setLoading(false);
  }, []);

  // 조회 조건이 바뀌면 렌더 중에 로딩 상태를 초기화
  const requestKey = `${companyId}|${currentPage}|${filterAccrualYm}|${filterPaymentYm}|${viewMode}`;
  const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
  if (requestKey !== prevRequestKey) {
    setPrevRequestKey(requestKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    void fetchSalaryData({
      companyId,
      currentPage,
      filterAccrualYm,
      filterPaymentYm,
      viewMode,
    }).then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [
    companyId,
    currentPage,
    filterAccrualYm,
    filterPaymentYm,
    viewMode,
    applyResult,
  ]);

  // 발송 완료 후 등 외부에서 다시 불러올 때 사용
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    applyResult(
      await fetchSalaryData({
        companyId,
        currentPage,
        filterAccrualYm,
        filterPaymentYm,
        viewMode,
      }),
    );
  }, [
    companyId,
    currentPage,
    filterAccrualYm,
    filterPaymentYm,
    viewMode,
    applyResult,
  ]);

  return {
    earnedData,
    businessData,
    dailyData,
    otherData,
    loading,
    error,
    refetch,
  };
}
