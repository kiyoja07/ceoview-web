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
            {profile && profile.companies.length >= 2 ? (
              <span className="relative inline-flex items-center">
                <select
                  aria-label="회사 선택"
                  value={profile.currentCompanyId ?? company.id}
                  disabled={switchingCompany || loading}
                  onChange={(event) => {
                    onCompanyChange(event.target.value);
                  }}
                  className="appearance-none bg-transparent pr-7 text-3xl font-bold tracking-tight text-white outline-none disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {profile.companies.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      className="text-sm font-medium text-gray-900"
                    >
                      {item.businessName ||
                        formatBusinessNumber(item.businessNumber)}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute right-0 h-5 w-5 text-emerald-100/80"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              companyLabel
            )}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90">
            {formatBusinessNumber(company.businessNumber)}
          </p>
        </div>
      </div>
    </div>
  );
}
