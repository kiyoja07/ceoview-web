import Link from "next/link";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatCurrencyKRW } from "@/app/lib/formatters";

type FinancialReportOverviewSectionProps = {
  financialReport: CompanyDashboardResponse["financialReport"];
};

export function FinancialReportOverviewSection({
  financialReport,
}: FinancialReportOverviewSectionProps) {
  const financialReportHref = "/company/financial-report";
  const isVisible =
    financialReport.hasReport &&
    (financialReport.publishStatus === "PUBLISHED" ||
      financialReport.isAgentView);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <Link
          href={financialReportHref}
          className="group inline-flex items-center gap-1.5 text-xl font-bold tracking-tight text-gray-900 transition hover:text-indigo-600"
        >
          재무리포트
          <ChevronRightIcon className="h-5 w-5 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
        </Link>
      </div>

      {isVisible ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href={financialReportHref}
              className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <DashboardMetricCard
                label="회계연도"
                value={
                  financialReport.fiscalYear
                    ? `${financialReport.fiscalYear}년`
                    : "-"
                }
                description={`${financialReport.entryCount.toLocaleString()}건`}
                tone="emerald"
                icon={<DocumentIcon />}
              />
            </Link>
            <Link
              href={financialReportHref}
              className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <DashboardMetricCard
                label="수익 합계"
                value={formatCurrencyKRW(financialReport.revenueTotal)}
                description={
                  financialReport.agentOrganizationName
                    ? `${financialReport.agentOrganizationName} 제공`
                    : "세무대리인 제공"
                }
                tone="blue"
                icon={<RevenueIcon />}
              />
            </Link>
            <Link
              href={financialReportHref}
              className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <DashboardMetricCard
                label="비용 합계"
                value={formatCurrencyKRW(financialReport.expenseTotal)}
                description={
                  financialReport.agentOrganizationName
                    ? `${financialReport.agentOrganizationName} 제공`
                    : "세무대리인 제공"
                }
                tone="amber"
                icon={<ExpenseIcon />}
              />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-base font-semibold text-gray-900">
            게시된 재무 리포트가 없습니다.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            세무대리인이 재무 리포트를 게시하면 이곳에서 회계연도, 수익 · 비용
            요약을 확인할 수 있습니다.
          </p>
          <div className="mt-5">
            <Link
              href={financialReportHref}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              재무리포트 화면 보기
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function DocumentIcon() {
  return (
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m0 0-2.25-2.25M12 18.75l2.25-2.25M6.75 3v18l6.75-3.375L20.25 21V3H6.75Z"
      />
    </svg>
  );
}

function RevenueIcon() {
  return (
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
        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.35-1.048m0 0-5.25-1.087m5.25 1.087L18.75 15"
      />
    </svg>
  );
}

function ExpenseIcon() {
  return (
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
        d="M2.25 6 9 12.75l4.306-4.306a11.95 11.95 0 0 0 5.814 5.518l2.35 1.048m0 0-5.25 1.087m5.25-1.087L18.75 9"
      />
    </svg>
  );
}
