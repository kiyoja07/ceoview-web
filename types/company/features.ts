// 에이전트가 거래처(Company)에 선택적으로 제공하는 기능 플래그
export type CompanyFeatureFlags = {
  salary: boolean; // 인건비 / 직원(지급 대상자) 관리
  financialReport: boolean; // 재무리포트
};

// 에이전트 연결이 없거나 값이 없을 때의 기본값 : 모든 기능 노출
export const DEFAULT_COMPANY_FEATURE_FLAGS: CompanyFeatureFlags = {
  salary: true,
  financialReport: true,
};

// AgentOrganizationCompany 링크의 원본 플래그를 프론트 친화 형태로 정규화
export function resolveCompanyFeatureFlags(
  link:
    | {
        salaryFeatureEnabled?: boolean | null;
        financialReportFeatureEnabled?: boolean | null;
      }
    | null
    | undefined,
): CompanyFeatureFlags {
  if (!link) {
    return { ...DEFAULT_COMPANY_FEATURE_FLAGS };
  }

  return {
    salary: link.salaryFeatureEnabled ?? true,
    financialReport: link.financialReportFeatureEnabled ?? true,
  };
}
