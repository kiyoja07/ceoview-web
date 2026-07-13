import type { CompanyDashboardResponse } from "@/types/company/dashboard";

type AgentOrganizationCardProps = {
  agentOrganization: CompanyDashboardResponse["agentOrganization"];
  agentLabel: string;
};

export function AgentOrganizationCard({
  agentOrganization,
  agentLabel,
}: AgentOrganizationCardProps) {
  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">세무대리인</p>

          {agentOrganization ? (
            <>
              <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                {agentLabel}
              </p>
              {agentOrganization.phone && (
                <p className="mt-1 text-sm text-gray-500">
                  전화번호 {agentOrganization.phone}
                </p>
              )}
              {agentOrganization.representativeName && (
                <p className="mt-1 text-sm text-gray-500">
                  대표자 {agentOrganization.representativeName}
                </p>
              )}
            </>
          ) : (
            <div className="mt-2 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9 9 0 1 0-12 0M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    담당 세무대리인이 없습니다
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    세무대리인이 거래처를 등록하면 연결됩니다
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
