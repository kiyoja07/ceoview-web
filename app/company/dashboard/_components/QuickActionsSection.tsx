import type { CompanyFeatureFlags } from "@/types/company/features";
import { QuickActionCard } from "./QuickActionCard";

type QuickActionsSectionProps = {
  companyId: string;
  features: CompanyFeatureFlags;
};

export function QuickActionsSection({
  companyId,
  features,
}: QuickActionsSectionProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          바로 가기
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.financialReport && (
          <QuickActionCard
            href="/company/financial-report"
            title="재무리포트 보기"
            description="회계연도별 수익, 비용 요약과 재무 리포트를 확인합니다."
            icon={<ReportIcon />}
          />
        )}
        {features.salary && (
          <QuickActionCard
            href={`/company/${companyId}/salary/dashboard`}
            title="인건비 내역 보기"
            description="월별 인건비 내역과 지급 상세를 확인합니다."
            icon={<DocumentIcon />}
          />
        )}
        {features.salary && (
          <QuickActionCard
            href="/company/employees"
            title="인건비 대상자 관리"
            description="인건비 대상자 목록을 보고 상태와 현황을 관리합니다."
            icon={<PeopleIcon />}
          />
        )}
        <QuickActionCard
          href="/company/settings/info"
          title="회사 정보 관리"
          description="회사 정보를 확인하고 수정합니다."
          icon={<BuildingIcon />}
        />
      </div>
    </section>
  );
}

function ReportIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v-6m3.75 6v-10.5m3.75 10.5v-3.75M6.75 21h10.5A2.25 2.25 0 0 0 19.5 18.75V5.25A2.25 2.25 0 0 0 17.25 3H6.75A2.25 2.25 0 0 0 4.5 5.25v13.5A2.25 2.25 0 0 0 6.75 21Z"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15A2.25 2.25 0 0 0 6.75 21.75h10.5A2.25 2.25 0 0 0 19.5 19.5v-5.25Z"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.003c0 .252-.005.503-.014.754M12 15.75a4.125 4.125 0 1 0 0-8.25 4.125 4.125 0 0 0 0 8.25Z"
      />
    </svg>
  );
}

function AddEmployeeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v9m4.5-4.5h-9m-6.75 8.25h-1.5A2.25 2.25 0 0 1 3 18V6A2.25 2.25 0 0 1 5.25 3.75h9A2.25 2.25 0 0 1 16.5 6v1.5"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3Zm4.5 4.5h6"
      />
    </svg>
  );
}
