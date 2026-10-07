import type { NavDefinition } from "@/catalogs/types";

export const COMPANY_HEADER_NAV_ITEMS: NavDefinition[] = [
  { href: "/company/dashboard", label: "대시보드" },
  { slug: "salary", label: "인건비" },
  { slug: "financial-report", label: "재무리포트" },
  { href: "/company/employees", label: "지급 대상자" },
  {
    href: "/company/settings/profile",
    label: "설정",
    activePrefix: "/company/settings",
  },
];

export const COMPANY_MANAGE_TABS: NavDefinition[] = [
  { href: "/company/settings/profile", label: "내 정보" },
  { href: "/company/settings/info", label: "회사 정보" },
  { href: "/company/settings/users", label: "회사 사용자" },
];

export const AGENT_HEADER_NAV_ITEMS: NavDefinition[] = [
  { href: "/agent/company", label: "거래처 목록" },
  // { href: "/agent/employees", label: "직원 현황" },
  // { href: "/agent/salary", label: "급여 현황" },
  { href: "/agent/financial-report", label: "재무리포트" },
  { href: "/agent/organization", label: "설정" },
];

export const AGENT_ORGANIZATION_MANAGE_TABS: NavDefinition[] = [
  { href: "/agent/organization/info", label: "회사 정보" },
  { href: "/agent/organization/users", label: "회사 사용자" },
  { href: "/agent/organization/profile", label: "내 정보" },
];

export const AGENT_COMPANY_MANAGE_TABS: NavDefinition[] = [
  { slug: "overview", label: "개요" },
  // { slug: "employees", label: "직원" },
  // { slug: "salary", label: "급여" },
  { slug: "financial-report", label: "재무리포트" },
  { slug: "settings", label: "설정" },
];

export const AGENT_COMPANY_SETTINGS_TABS: NavDefinition[] = [
  { slug: "info", label: "거래처 정보" },
  { slug: "features", label: "제공 기능" },
  { slug: "users", label: "거래처 사용자" },
];

export const AGENT_COMPANY_FINANCIAL_REPORT_TABS: NavDefinition[] = [
  { slug: "generate", label: "리포트 생성" },
  { slug: "reports", label: "저장된 리포트" },
];

export const EMPLOYEE_HEADER_NAV_ITEMS: NavDefinition[] = [
  { href: "/employee", label: "홈" },
  { href: "/employee/payslips", label: "급여 명세서" },
  { href: "/employee/settings", label: "내 정보" },
];
