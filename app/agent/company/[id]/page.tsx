"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatBusinessNumber } from "@/app/agent/_components/business-form/shared";
import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";
import type { AgentCompanyUsersResponse } from "@/types/agent/company";
import type { PublicationStatusResponse } from "./_salary/_lib/types";

type CompanyInfo = {
  id: string;
  businessNumber: string;
  businessName: string | null;
  businessType: "INDIVIDUAL" | "CORPORATION";
  representativeName: string | null;
};

type EmployeePublicationSnapshot = {
  success: boolean;
  totalCount: number;
  savedCount: number;
  publishedCount: number;
};

type FinancialReportSnapshot = {
  activeReportId: string | null;
  reports: Array<{ id: string }>;
};

type OverviewData = {
  company: CompanyInfo;
  employee: EmployeePublicationSnapshot;
  salary: PublicationStatusResponse;
  financialReport: FinancialReportSnapshot;
  users: AgentCompanyUsersResponse;
};

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

export default function AgentCompanyOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OverviewData | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          companyRes,
          employeeRes,
          salaryRes,
          financialReportRes,
          usersRes,
        ] = await Promise.all([
          fetch(`/api/agent/company/${companyId}/info`, {
            cache: "no-store",
          }),
          fetch(`/api/agent/company/${companyId}/employee-publication`, {
            cache: "no-store",
          }),
          fetch(`/api/agent/company/${companyId}/salary-publication`, {
            cache: "no-store",
          }),
          fetch(`/api/agent/financial-report/reports?companyId=${companyId}`, {
            cache: "no-store",
          }),
          fetch(`/api/agent/company/${companyId}/users`, {
            cache: "no-store",
          }),
        ]);

        if (
          companyRes.status === 401 ||
          employeeRes.status === 401 ||
          salaryRes.status === 401 ||
          financialReportRes.status === 401 ||
          usersRes.status === 401
        ) {
          router.replace("/agent/auth/login");
          return;
        }

        if (
          companyRes.status === 403 ||
          employeeRes.status === 403 ||
          salaryRes.status === 403 ||
          financialReportRes.status === 403 ||
          usersRes.status === 403
        ) {
          router.replace("/agent/auth/organization");
          return;
        }

        if (
          !companyRes.ok ||
          !employeeRes.ok ||
          !salaryRes.ok ||
          !financialReportRes.ok ||
          !usersRes.ok
        ) {
          throw new Error("거래처 개요를 불러오지 못했습니다.");
        }

        const [company, employee, salary, financialReport, users] =
          await Promise.all([
            companyRes.json() as Promise<CompanyInfo>,
            employeeRes.json() as Promise<EmployeePublicationSnapshot>,
            salaryRes.json() as Promise<PublicationStatusResponse>,
            financialReportRes.json() as Promise<FinancialReportSnapshot>,
            usersRes.json() as Promise<AgentCompanyUsersResponse>,
          ]);

        setData({ company, employee, salary, financialReport, users });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "거래처 개요를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [companyId, router, retryKey]);

  const title = useMemo(() => {
    if (!data) return "";
    const number = formatBusinessNumber(data.company.businessNumber);
    return data.company.businessName
      ? `${data.company.businessName} (${number})`
      : number;
  }, [data]);

  const publishedUploads =
    data?.salary.uploads.filter((item) => item.publishStatus === "PUBLISHED")
      .length ?? 0;

  const summaryCards = data
    ? [
        {
          isActive: false,
          label: "직원",
          value: `${data.employee.totalCount}명`,
          hint: `공개 ${data.employee.publishedCount}명 · 비공개 ${data.employee.savedCount}명`,
        },
        {
          isActive: true,
          label: "재무리포트",
          value: `${data.financialReport.reports.length}건`,
          hint: `공개 ${data.financialReport.activeReportId ? 1 : 0}건`,
        },
        {
          isActive: false,
          label: "급여 업로드",
          value: `${data.salary.uploads.length}건`,
          hint: `공개 ${publishedUploads}건`,
        },

        {
          isActive: true,
          label: "거래처 사용자",
          value: `${data.users.summary.total}명`,
          hint: `활성 ${data.users.summary.active}명 · 마스터 ${data.users.summary.masters}명`,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        {loading ? (
          <LoadingPanel message="거래처 개요를 불러오는 중..." card />
        ) : error ? (
          <ErrorPanel
            message={error}
            card
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : data ? (
          <>
            <div className="mb-6 rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-sm">
              <p className="text-sm text-slate-300">거래처 개요</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {title}
              </h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                <span>{formatBusinessNumber(data.company.businessNumber)}</span>
                {data.company.representativeName && (
                  <span>대표자 {data.company.representativeName}</span>
                )}
                <span>
                  {data.company.businessType === "INDIVIDUAL"
                    ? "개인사업자"
                    : "법인사업자"}
                </span>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {summaryCards
                .filter((card) => card.isActive)
                .map((card) => (
                  <SummaryCard key={card.label} {...card} />
                ))}
            </div>

            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link
                href={`/agent/company/${companyId}/employees`}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">직원 보기</p>
                <p className="mt-1 text-sm text-gray-500">
                  직원 목록, 공개 상태, 신규 등록으로 이동합니다.
                </p>
              </Link>
              <Link
                href={`/agent/company/${companyId}/salary`}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">급여 보기</p>
                <p className="mt-1 text-sm text-gray-500">
                  급여 업로드 목록과 공개 상태를 관리합니다.
                </p>
              </Link>
              <Link
                href={`/agent/company/${companyId}/settings/info`}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">설정 열기</p>
                <p className="mt-1 text-sm text-gray-500">
                  거래처 기본 정보와 사용자 관리를 확인합니다.
                </p>
              </Link>
            </div> */}
          </>
        ) : null}
      </div>
    </div>
  );
}
