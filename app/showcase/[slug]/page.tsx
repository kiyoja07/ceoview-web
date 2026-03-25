import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllShowcaseSlugs, getShowcaseBySlug } from "@/catalogs/showcase";
import SiteHeader from "@/app/_components/SiteHeader";
import type { ShowcaseSlug } from "@/types/showcase";
import {
  buildAgentCompanies,
  buildSalaryStats,
  buildSalarySummary,
} from "./_components/showcase-utils";
import { SectionLabel } from "./_components/ShowcaseUI";
import AgentSection from "./_components/AgentSection";
import CompanySection from "./_components/CompanySection";
import SalarySection from "./_components/SalarySection";
import EmployeeSection from "./_components/EmployeeSection";
import PayslipSection from "./_components/PayslipSection";
import SalaryUploadSection from "./_components/SalaryUploadSection";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllShowcaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: ShowcaseSlug }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scenario = getShowcaseBySlug(slug);

  if (!scenario) return {};

  return {
    title: `${scenario.public.title} showcase`,
    description: scenario.public.subtitle,
  };
}

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ slug: ShowcaseSlug }>;
}) {
  const { slug } = await params;
  const scenario = getShowcaseBySlug(slug);

  if (!scenario) {
    notFound();
  }

  const agentCompanies = buildAgentCompanies(scenario.agent.companies);
  const salaryStats = buildSalaryStats(scenario);
  const salarySummary = buildSalarySummary(salaryStats);
  const firstRequest = scenario.company.pendingRequests[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <SiteHeader
        sticky
        navItems={[{ href: "/", label: "홈으로", variant: "secondary" }]}
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {scenario.public.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {scenario.public.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8 lg:px-8">
        {/* 쇼케이스 히어로 */}
        <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_70px_-32px_rgba(15,23,42,0.6)] sm:px-8">
          <SectionLabel>Showcase</SectionLabel>
          <h2 className="mt-4 max-w-4xl text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
            {scenario.public.headline}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {scenario.public.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {scenario.public.highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <nav className="sticky top-3 z-10 flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur">
          <a
            href="#agent"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            세무대리인
          </a>
          <a
            href="#salary-upload"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
          >
            급여 등록
          </a>
          <a
            href="#company"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
          >
            회사 관리자
          </a>
          <a
            href="#salary"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
          >
            급여 지급 현황
          </a>
          <a
            href="#employee"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
          >
            직원 포털
          </a>
          <a
            href="#payslip"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
          >
            명세서 상세
          </a>
        </nav>

        <AgentSection scenario={scenario} agentCompanies={agentCompanies} />
        <SalaryUploadSection scenario={scenario} />
        <CompanySection scenario={scenario} firstRequest={firstRequest} />
        <SalarySection
          scenario={scenario}
          salaryStats={salaryStats}
          salarySummary={salarySummary}
        />
        <EmployeeSection scenario={scenario} />
        <PayslipSection scenario={scenario} />
      </div>
    </main>
  );
}
