import CompanyListHeader from "@/app/agent/company/_components/CompanyListHeader";
import CompanyTable from "@/app/agent/company/_components/CompanyTable";
import OnboardingGuide from "@/app/agent/company/_components/OnboardingGuide";
import type { AgentCompanyListItem } from "@/types/agent/company";
import { extractNumber } from "./showcase-utils";
import type { ShowcaseScenario } from "./showcase-utils";
import { SectionLabel } from "./ShowcaseUI";

export default function AgentSection({
  scenario,
  agentCompanies,
}: {
  scenario: ShowcaseScenario;
  agentCompanies: AgentCompanyListItem[];
}) {
  return (
    <section id="agent" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          세무대리인 관리 화면
        </h2>
      </div>
      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <div className="min-h-screen bg-app-bg">
          <div className="mx-auto max-w-5xl p-6 lg:p-8">
            <CompanyListHeader
              count={extractNumber(
                scenario.agent.overviewMetrics[0]?.value ?? "0",
              )}
            />
            <OnboardingGuide />
            <div className="pointer-events-none">
              <CompanyTable companies={agentCompanies} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
