"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmployeeForm } from "@/app/company/organization/employees/_components/EmployeeForm";
import { BusinessIncomeEmployeeForm } from "@/app/company/organization/employees/_components/BusinessIncomeEmployeeForm";
import { OtherIncomeEmployeeForm } from "@/app/company/organization/employees/_components/OtherIncomeEmployeeForm";
import { OtherIncomeLaborEmployeeForm } from "@/app/company/organization/employees/_components/OtherIncomeLaborEmployeeForm";
import type { EmployeeIncomeType } from "@/types/company/employees";
import { EMPLOYEE_INCOME_TYPE_OPTIONS } from "@/catalogs/ko/employee";

export default function NewEmployeePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [incomeType, setIncomeType] =
    useState<EmployeeIncomeType>("EARNED_INCOME");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/company/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/company/auth/login");
          return;
        }
        if (res.ok) {
          const me = (await res.json()) as { profileComplete?: boolean };
          if (!me.profileComplete) {
            router.replace("/company/auth/onboarding");
            return;
          }
        }
        setAuthChecked(true);
      } catch {
        router.replace("/company/auth/login");
      }
    };
    void check();
  }, [router]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/company/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, incomeType }),
    });

    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      throw new Error(
        ("error" in body ? body.error : undefined) ||
          "직원 등록에 실패했습니다.",
      );
    }

    router.push("/company/employees");
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const cancelPath = "/company/employees";

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            인건비 지급 대상자 등록
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            인건비 대상자들의 이메일과 연락처까지 입력하면, 급여명세서를
            자동으로 발송할수 있습니다.
          </p>
        </div>

        <>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                소득유형 <span className="text-red-500">*</span>
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
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록하기"
                showResignDate={false}
                requireResidentNumber
              />
            )}
            {incomeType === "BUSINESS_INCOME" && (
              <BusinessIncomeEmployeeForm
                onSubmit={handleSubmit}
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록하기"
                showEmployeeCode={false}
                showIncomeCategory={false}
                showBusinessInfo={false}
                showAffiliationDates={false}
                requireResidentNumber
                defaultNationalityType="내국인"
                defaultResidenceType="거주자"
              />
            )}
            {incomeType === "OTHER_INCOME" && (
              <OtherIncomeEmployeeForm
                onSubmit={handleSubmit}
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록하기"
                showEmployeeCode={false}
                requireResidentNumber
              />
            )}
            {incomeType === "OTHER_INCOME_LABOR" && (
              <OtherIncomeLaborEmployeeForm
                onSubmit={handleSubmit}
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록하기"
                showEmployeeCode={false}
                requireResidentNumber
              />
            )}
        </>
      </div>
    </div>
  );
}
