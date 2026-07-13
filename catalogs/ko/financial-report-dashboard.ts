import type { KeyLabel } from "@/catalogs/types";
import type { FilterMode } from "@/app/agent/financial-report/_components/types";

export const FINANCIAL_REPORT_DASHBOARD_FILTER_OPTIONS: KeyLabel<FilterMode>[] =
  [
    { key: "all", label: "전체" },
    { key: "published", label: "게시됨" },
    { key: "unpublished", label: "미게시" },
    { key: "no-report", label: "미등록" },
  ];
