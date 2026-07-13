import Link from "next/link";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatCurrencyKRW } from "@/app/lib/formatters";

type SalaryOverviewSectionProps = {
  companyId: string;
  salary: CompanyDashboardResponse["salary"];
};

export function SalaryOverviewSection({
  companyId,
  salary,
}: SalaryOverviewSectionProps) {
  const salaryDashboardHref = `/company/${companyId}/salary/dashboard`;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <Link
            href={salaryDashboardHref}
            className="group inline-flex items-center gap-1.5 text-xl font-bold tracking-tight text-gray-900 transition hover:text-emerald-600"
          >
            인건비
            <ChevronRightIcon className="h-5 w-5 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
          </Link>
        </div>
      </div>

      {salary.hasData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DashboardMetricCard
              label="최신 인건비 월"
              value={salary.latestLabel || "-"}
              description={`${salary.totalCount.toLocaleString()}건`}
              tone="emerald"
              icon={<CalendarIcon />}
            />
            <DashboardMetricCard
              label="총 지급액"
              value={formatCurrencyKRW(salary.totalPayment)}
              description={`${salary.latestLabel} 최신 인건비 기준`}
              tone="blue"
              icon={<PaymentIcon />}
            />
            <DashboardMetricCard
              label="차인지급액"
              value={formatCurrencyKRW(salary.netPayment)}
              description={`${salary.latestLabel} 최신 인건비 기준`}
              tone="amber"
              icon={<NetPaymentIcon />}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-base font-semibold text-gray-900">
            인건비 내역이 없습니다.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            지급 내역이 생기면 인건비 내역 화면에서 최신 인건비 월과 추이를
            확인할 수 있습니다.
          </p>
          <div className="mt-5">
            <Link
              href={salaryDashboardHref}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              인건비 대시보드 보기
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

function CalendarIcon() {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75"
      />
    </svg>
  );
}

function PaymentIcon() {
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
        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M12 6v12m3-9H9"
      />
    </svg>
  );
}

function NetPaymentIcon() {
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
        d="M12 6v12m0 0 4-4m-4 4-4-4M3.75 7.5h16.5"
      />
    </svg>
  );
}
