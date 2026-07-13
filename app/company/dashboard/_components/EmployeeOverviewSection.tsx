import Link from "next/link";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { DashboardMetricCard } from "./DashboardMetricCard";

type EmployeeOverviewSectionProps = {
  employees: CompanyDashboardResponse["employees"];
};

export function EmployeeOverviewSection({
  employees,
}: EmployeeOverviewSectionProps) {
  const employeeMasterTotal =
    employees.earnedMasterCount +
    employees.businessMasterCount +
    employees.otherMasterCount +
    employees.dailyMasterCount;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <Link
            href="/company/employees"
            className="group inline-flex items-center gap-1.5 text-xl font-bold tracking-tight text-gray-900 transition hover:text-emerald-600"
          >
            인건비 지급 대상자
            <ChevronRightIcon className="h-5 w-5 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
          </Link>
        </div>
      </div>

      {employeeMasterTotal > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardMetricCard
            label="재직 중 상시 직원"
            value={`${employees.earnedRecentPaidCount.toLocaleString()}명`}
            description={`전체: ${employees.earnedMasterCount.toLocaleString()}명, 최근 지급: ${employees.earnedRecentPaidCount.toLocaleString()}명`}
            tone="emerald"
            icon={<PeopleIcon />}
          />
          <DashboardMetricCard
            label="사업소득자"
            value={`${employees.businessRecentPaidCount.toLocaleString()}명`}
            description={`전체: ${employees.businessMasterCount.toLocaleString()}명, 최근 지급: ${employees.businessRecentPaidCount.toLocaleString()}명`}
            tone="blue"
            icon={<BusinessIcon />}
          />
          <DashboardMetricCard
            label="기타소득자"
            value={`${employees.otherRecentPaidCount.toLocaleString()}명`}
            description={`전체: ${employees.otherMasterCount.toLocaleString()}명, 최근 지급: ${employees.otherRecentPaidCount.toLocaleString()}명`}
            tone="blue"
            icon={<DocumentIcon />}
          />
          <DashboardMetricCard
            label="일용직소득자"
            value={`${employees.dailyRecentPaidCount.toLocaleString()}명`}
            description={`전체: ${employees.dailyMasterCount.toLocaleString()}명, 최근 지급: ${employees.dailyRecentPaidCount.toLocaleString()}명`}
            tone="blue"
            icon={<ToolIcon />}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-base font-semibold text-gray-900">
            아직 등록된 직원이 없습니다.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            직원을 등록하면 이 영역에서 직원 현황을 확인할 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/company/employees/new"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              직원 등록
            </Link>
            <Link
              href="/company/employees"
              className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              직원 관리
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
        d="M18 18.72a8.964 8.964 0 0 0 3.742-.479A3.75 3.75 0 0 0 18 15.75M15 20.25a8.97 8.97 0 0 1-6 0M6 18.72a8.964 8.964 0 0 1-3.742-.479A3.75 3.75 0 0 1 6 15.75m12 2.97a8.97 8.97 0 0 1-12 0M15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function BusinessIcon() {
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
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function ToolIcon() {
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
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.194-.14 1.743"
      />
    </svg>
  );
}
