import type { KeyLabel } from "@/catalogs/types";
import type { FilterMode } from "@/app/agent/employees/_components/types";

export const EMPLOYEE_DASHBOARD_FILTER_OPTIONS: KeyLabel<FilterMode>[] = [
  { key: "all", label: "전체" },
  { key: "published", label: "발행완료" },
  { key: "unpublished", label: "비공개" },
  { key: "has-employees", label: "등록완료" },
  { key: "no-employees", label: "미등록" },
];
