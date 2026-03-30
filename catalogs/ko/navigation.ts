import type { NavDefinition } from "@/catalogs/types";

export const COMPANY_HEADER_NAV_ITEMS: NavDefinition[] = [
  { href: "/company/dashboard", label: "대시보드" },
  { slug: "salary", label: "인건비" },
  { href: "/company/employees", label: "지급 대상자" },
  { href: "/company/requests", label: "요청 현황" },
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
  { href: "/company/settings/billing", label: "결제" },
];

export const AGENT_HEADER_NAV_ITEMS: NavDefinition[] = [
  { href: "/agent/company", label: "거래처" },
  { href: "/agent/organization", label: "조직 설정" },
  { href: "/agent/billing", label: "결제" },
];

export const AGENT_COMPANY_MODULE_TABS: NavDefinition[] = [
  { href: "/agent/company", label: "거래처 목록" },
  { href: "/agent/company/requests", label: "요청함" },
  { href: "/agent/company/employees", label: "직원 현황" },
  { href: "/agent/company/salary", label: "급여 현황" },
];

export const AGENT_ORGANIZATION_MANAGE_TABS: NavDefinition[] = [
  { href: "/agent/organization/profile", label: "내 정보" },
  { href: "/agent/organization/info", label: "회사 정보" },
  { href: "/agent/organization/users", label: "회사 사용자" },
];

export const AGENT_COMPANY_MANAGE_TABS: NavDefinition[] = [
  { slug: "overview", label: "개요" },
  { slug: "employees", label: "직원" },
  { slug: "salary", label: "급여" },
  { slug: "settings", label: "설정" },
];

export const AGENT_COMPANY_SETTINGS_TABS: NavDefinition[] = [
  { slug: "info", label: "기본 정보" },
  { slug: "users", label: "거래처 사용자" },
];

export const EMPLOYEE_HEADER_NAV_ITEMS: NavDefinition[] = [
  { href: "/employee", label: "홈" },
  { href: "/employee/payslips", label: "급여 명세서" },
  { href: "/employee/settings", label: "내 정보" },
];
