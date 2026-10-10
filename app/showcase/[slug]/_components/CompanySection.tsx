import Link from "next/link";
import { DashboardMetricCard } from "@/app/company/dashboard/_components/DashboardMetricCard";
import { QuickActionCard } from "@/app/company/dashboard/_components/QuickActionCard";
import { formatBusinessNumber } from "@/app/lib/payslip/format";
import { toneFromMetric } from "./showcase-utils";
import type { ShowcaseScenario } from "./showcase-utils";
import { SectionLabel, ArrowTileIcon } from "./ShowcaseUI";

export default function CompanySection({
  scenario,
}: {
  scenario: ShowcaseScenario;
}) {
  return (
    <section id="company" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          회사 관리자 화면
        </h2>
      </div>
      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <div className="min-h-screen bg-app-bg">
          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            <div className="mb-8 rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-lg shadow-emerald-200/60">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight">
                    {scenario.company.businessName}
                  </h1>
                  <p className="mt-2 text-sm text-emerald-100/90">
                    {formatBusinessNumber(
                      scenario.company.businessNumber.replace(/\D/g, ""),
                    )}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur w-xs ">
                  <label className="mb-1.5 block text-xs font-medium text-emerald-100/80">
                    회사 선택
                  </label>
                  <select
                    disabled
                    className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-medium text-white outline-none disabled:cursor-not-allowed disabled:opacity-80"
                    value="current"
                  >
                    <option className="text-gray-900" value="current">
                      {scenario.company.businessName}
                    </option>
                    <option className="text-gray-900" value="second">
                      브릭웨이브 서브법인
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    담당 세무대리인
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                    {scenario.company.agentOrganizationName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    전화번호 02-6205-1198
                  </p>
                  <p className="mt-1 text-sm text-gray-500">대표자 윤한결</p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">
                    인건비
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="#salary"
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    인건비 관리
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {scenario.company.salaryMetrics.map((metric) => (
                    <DashboardMetricCard
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                      description={metric.description}
                      tone={toneFromMetric(metric.tone)}
                      icon={<span />}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">
                    인건비 지급 대상자
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/company/employees"
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    대상자 관리
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {scenario.company.employeeMetrics.map((metric) => (
                  <DashboardMetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    tone={toneFromMetric(metric.tone)}
                    icon={<span />}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">
                  바로 가기
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {scenario.company.quickActions.map((action) => (
                  <QuickActionCard
                    key={action.title}
                    href={action.disabled ? "#company" : action.href}
                    title={action.title}
                    description={action.description}
                    icon={<ArrowTileIcon />}
                  />
                ))}
                <QuickActionCard
                  href="#employee"
                  title="직원 포털 미리보기"
                  description="직원이 명세서를 어떻게 확인하는지 바로 이어서 볼 수 있습니다."
                  icon={<ArrowTileIcon />}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
