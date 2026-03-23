"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmployeeForm } from "../organization/employees/_components/EmployeeForm";
import { BusinessIncomeEmployeeForm } from "../organization/employees/_components/BusinessIncomeEmployeeForm";
import { OtherIncomeEmployeeForm } from "../organization/employees/_components/OtherIncomeEmployeeForm";
import { OtherIncomeLaborEmployeeForm } from "../organization/employees/_components/OtherIncomeLaborEmployeeForm";
import type {
  CompanyMutationRequestResponse,
  PendingRequestSummary,
} from "@/types/company/change-request";
import type { EmployeeIncomeType } from "@/types/company/employees";

const INCOME_TYPE_OPTIONS: { value: EmployeeIncomeType; label: string }[] = [
  { value: "EARNED_INCOME", label: "근로소득자" },
  { value: "BUSINESS_INCOME", label: "사업소득자" },
  { value: "OTHER_INCOME", label: "기타소득자" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득자" },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [incomeType, setIncomeType] =
    useState<EmployeeIncomeType>("EARNED_INCOME");
  const [submittedRequest, setSubmittedRequest] =
    useState<PendingRequestSummary | null>(null);

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

    const body = (await res.json()) as
      | CompanyMutationRequestResponse
      | { error?: string };
    if (!res.ok) {
      throw new Error(
        ("error" in body ? body.error : undefined) ||
          "직원 등록에 실패했습니다.",
      );
    }

    setSubmittedRequest((body as CompanyMutationRequestResponse).request);
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
            직원 등록
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            새 직원의 정보를 입력해주세요.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            직원들의 이메일과 연락처를 입력하시면, 급여명세서를 자동으로 발송할
            수 있습니다.
          </p>
        </div>

        {submittedRequest ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
            <p className="text-base font-semibold">
              직원 등록 요청이 제출되었습니다.
            </p>
            <p className="mt-2">
              세무대리인이 확인 후 최종 등록하면 직원 목록에 반영됩니다.
            </p>
            <p className="mt-2 text-xs text-amber-700">
              접수일 {new Date(submittedRequest.createdAt).toLocaleString()}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/company/requests")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                요청 현황 보기
              </button>
              <button
                type="button"
                onClick={() => router.push("/company/employees")}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                직원 목록으로
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                소득유형 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {INCOME_TYPE_OPTIONS.map((opt) => (
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
                submitLabel="등록 요청"
              />
            )}
            {incomeType === "BUSINESS_INCOME" && (
              <BusinessIncomeEmployeeForm
                onSubmit={handleSubmit}
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록 요청"
              />
            )}
            {incomeType === "OTHER_INCOME" && (
              <OtherIncomeEmployeeForm
                onSubmit={handleSubmit}
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록 요청"
              />
            )}
            {incomeType === "OTHER_INCOME_LABOR" && (
              <OtherIncomeLaborEmployeeForm
                onSubmit={handleSubmit}
                onCancel={() => router.push(cancelPath)}
                submitLabel="등록 요청"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
