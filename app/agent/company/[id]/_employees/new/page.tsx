"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatBusinessNumber } from "@/app/lib/formatters";
import { EmployeeForm } from "@/app/company/organization/employees/_components/EmployeeForm";
import { BusinessIncomeEmployeeForm } from "@/app/company/organization/employees/_components/BusinessIncomeEmployeeForm";
import { OtherIncomeEmployeeForm } from "@/app/company/organization/employees/_components/OtherIncomeEmployeeForm";
import { OtherIncomeLaborEmployeeForm } from "@/app/company/organization/employees/_components/OtherIncomeLaborEmployeeForm";
import { EMPLOYEE_INCOME_TYPE_OPTIONS } from "@/catalogs/ko/employee";
import type { EmployeeIncomeType } from "@/types/company/employees";

type CompanyInfo = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

export default function AgentCompanyEmployeeNewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params?.id;

  const [authChecked, setAuthChecked] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [incomeType, setIncomeType] =
    useState<EmployeeIncomeType>("EARNED_INCOME");

  const handleAuthError = useCallback(
    (status: number) => {
      if (status === 401) {
        router.replace("/agent/auth/login");
        return true;
      }
      if (status === 403) {
        router.replace("/agent/auth/organization");
        return true;
      }
      return false;
    },
    [router],
  );

  useEffect(() => {
    if (!companyId) return;

    const check = async () => {
      try {
        const companyRes = await fetch(`/api/agent/company/${companyId}/info`, {
          cache: "no-store",
        });
        if (handleAuthError(companyRes.status)) return;
        if (companyRes.ok) {
          setCompany((await companyRes.json()) as CompanyInfo);
        }
        setAuthChecked(true);
      } catch {
        router.replace("/agent/auth/login");
      }
    };
    void check();
  }, [companyId, handleAuthError, router]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/agent/company/${companyId}/employee/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        incomeType,
      }),
    });

    const body = (await res.json()) as { error?: string; id?: string };
    if (!res.ok) {
      throw new Error(body.error || "직원 등록에 실패했습니다.");
    }

    router.push(`/agent/company/${companyId}/employees`);
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const titleCompany = company
    ? company.businessName
      ? `${company.businessName} (${formatBusinessNumber(company.businessNumber)})`
      : formatBusinessNumber(company.businessNumber)
    : "";

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <div className="mb-7">
          {titleCompany && (
            <p className="mb-2 text-base text-gray-700">{titleCompany}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            인건비 지급 대상자 등록
          </h1>
          <div className="mt-2">
            <p className="mt-1 text-sm text-gray-500">
              새 직원의 정보를 입력해주세요.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              이메일과 휴대폰 번호까지 입력하면, 거래처에서 급여명세서를
              자동으로 발송할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            소득자유형 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EMPLOYEE_INCOME_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  incomeType === opt.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="incomeType"
                  value={opt.value}
                  checked={incomeType === opt.value}
                  onChange={() => setIncomeType(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {incomeType === "EARNED_INCOME" && (
          <EmployeeForm
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/agent/company/${companyId}/employees`)}
            submitLabel="등록하기"
            showEmployeeCode
          />
        )}
        {incomeType === "BUSINESS_INCOME" && (
          <BusinessIncomeEmployeeForm
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/agent/company/${companyId}/employees`)}
            submitLabel="등록하기"
          />
        )}
        {incomeType === "OTHER_INCOME" && (
          <OtherIncomeEmployeeForm
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/agent/company/${companyId}/employees`)}
            submitLabel="등록하기"
          />
        )}
        {incomeType === "OTHER_INCOME_LABOR" && (
          <OtherIncomeLaborEmployeeForm
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/agent/company/${companyId}/employees`)}
            submitLabel="등록하기"
          />
        )}
      </div>
    </div>
  );
}
