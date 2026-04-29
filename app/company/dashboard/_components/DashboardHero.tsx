import Link from "next/link";
import { formatBusinessNumber } from "@/app/lib/formatters";
import type { CompanyAuthMeResponse } from "@/types/company/auth";

type DashboardHeroProps = {
  company: {
    id: string;
    businessName: string | null;
    businessNumber: string;
  };
  profile: CompanyAuthMeResponse | null;
  loading: boolean;
  switchingCompany: boolean;
  onCompanyChange: (companyId: string) => void;
};

export function DashboardHero({
  company,
  profile,
  loading,
  switchingCompany,
  onCompanyChange,
}: DashboardHeroProps) {
  const companyLabel =
    company.businessName || formatBusinessNumber(company.businessNumber);

  return (
    <div className="mb-8 rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-lg shadow-emerald-200/60">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {companyLabel}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90">
            {formatBusinessNumber(company.businessNumber)}
          </p>
        </div>
        {profile && profile.companies.length >= 2 && (
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <label
              htmlFor="dashboard-company-select"
              className="mb-1.5 block text-xs font-medium text-emerald-100/80"
            >
              회사 선택
            </label>
            <select
              id="dashboard-company-select"
              value={profile.currentCompanyId ?? company.id}
              disabled={switchingCompany || loading}
              onChange={(event) => {
                onCompanyChange(event.target.value);
              }}
              className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-medium text-white outline-none disabled:cursor-not-allowed disabled:opacity-80"
            >
              {profile.companies.map((item) => (
                <option key={item.id} value={item.id} className="text-gray-900">
                  {item.businessName || formatBusinessNumber(item.businessNumber)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-emerald-100/75">
              {switchingCompany
                ? "선택한 회사로 전환하는 중입니다."
                : "접근 가능한 회사 사이에서 현재 작업 회사를 전환할 수 있습니다."}
            </p>
            {!profile.profileComplete && (
              <p className="mt-2 text-xs text-amber-100">
                현재 선택한 회사의 기본 정보가 아직 완료되지 않았습니다.{" "}
                <Link href="/company/auth/onboarding" className="underline">
                  회사 정보 입력
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
