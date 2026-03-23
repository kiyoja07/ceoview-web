"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmployeeForm } from "@/app/company/organization/employees/_components/EmployeeForm";
import { BusinessIncomeEmployeeForm } from "@/app/company/organization/employees/_components/BusinessIncomeEmployeeForm";
import { OtherIncomeEmployeeForm } from "@/app/company/organization/employees/_components/OtherIncomeEmployeeForm";
import { OtherIncomeLaborEmployeeForm } from "@/app/company/organization/employees/_components/OtherIncomeLaborEmployeeForm";
import type { CompanyChangeRequestItem } from "@/types/company/change-request";
import type { EmployeeIncomeType } from "@/types/company/employees";

const INCOME_TYPE_OPTIONS: { value: EmployeeIncomeType; label: string }[] = [
  { value: "EARNED_INCOME", label: "근로소득자" },
  { value: "BUSINESS_INCOME", label: "사업소득자" },
  { value: "OTHER_INCOME", label: "기타소득자" },
  { value: "OTHER_INCOME_LABOR", label: "일용소득자" },
];

type CompanyInfo = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function AgentCompanyEmployeeNewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = params?.id;
  const requestId = searchParams.get("requestId");

  const [authChecked, setAuthChecked] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [incomeType, setIncomeType] =
    useState<EmployeeIncomeType>("EARNED_INCOME");
  const [requestItem, setRequestItem] =
    useState<CompanyChangeRequestItem | null>(null);
  const [initialData, setInitialData] = useState<
    Record<string, unknown> | undefined
  >(undefined);

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
        const [companyRes, requestRes] = await Promise.all([
          fetch(`/api/agent/company/${companyId}/info`, {
            cache: "no-store",
          }),
          requestId
            ? fetch(`/api/agent/company/requests/${requestId}`, {
                cache: "no-store",
              })
            : Promise.resolve(null),
        ]);
        if (handleAuthError(companyRes.status)) return;
        if (companyRes.ok) {
          setCompany((await companyRes.json()) as CompanyInfo);
        }
        if (requestRes?.status && handleAuthError(requestRes.status)) return;
        if (requestRes?.ok) {
          const requestData = (await requestRes.json()) as {
            item: CompanyChangeRequestItem;
          };
          setRequestItem(requestData.item);
          const payload = requestData.item.requestedPayload as Record<
            string,
            unknown
          > | null;
          if (payload) {
            const requestIncomeType = payload.incomeType as
              | EmployeeIncomeType
              | undefined;
            if (requestIncomeType) {
              setIncomeType(requestIncomeType);
            }
            setInitialData(payload);
          }
        }
        setAuthChecked(true);
      } catch {
        router.replace("/agent/auth/login");
      }
    };
    void check();
  }, [companyId, handleAuthError, requestId, router]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/agent/company/${companyId}/employee/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        incomeType,
        requestId,
      }),
    });

    const body = (await res.json()) as { error?: string; id?: string };
    if (!res.ok) {
      throw new Error(body.error || "직원 등록에 실패했습니다.");
    }

    router.push(
      requestId
        ? "/agent/company/requests"
        : `/agent/company/${companyId}/employees`,
    );
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
            직원 등록
          </h1>
          {requestItem && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              직원 신규 등록 요청이 접수 되었습니다.
              <div className="mt-1 text-xs text-amber-700">
                요청자 {requestItem.requestedByCompanyUser.name} · 접수일{" "}
                {new Date(requestItem.createdAt).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={async () => {
                  const reason = window.prompt("반려 사유를 입력해주세요.");
                  if (!reason?.trim()) return;
                  const res = await fetch(
                    `/api/agent/company/requests/${requestItem.id}/reject`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resolutionComment: reason.trim(),
                      }),
                    },
                  );
                  if (res.ok) {
                    router.replace("/agent/company/requests");
                  }
                }}
                className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              >
                반려
              </button>
            </div>
          )}
          <div className="mt-2">
            <p className="mt-1 text-sm text-gray-500">
              새 직원의 정보를 입력해주세요.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              직원들의 이메일과 연락처를 입력하면, 급여명세서를 자동으로 발송할
              수 있습니다.
            </p>
          </div>
        </div>

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
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() =>
              router.push(
                requestId
                  ? "/agent/company/requests"
                  : `/agent/company/${companyId}/employees`,
              )
            }
            submitLabel={requestId ? "요청 승인 후 등록" : "등록하기"}
          />
        )}
        {incomeType === "BUSINESS_INCOME" && (
          <BusinessIncomeEmployeeForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() =>
              router.push(
                requestId
                  ? "/agent/company/requests"
                  : `/agent/company/${companyId}/employees`,
              )
            }
            submitLabel={requestId ? "요청 승인 후 등록" : "등록하기"}
          />
        )}
        {incomeType === "OTHER_INCOME" && (
          <OtherIncomeEmployeeForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() =>
              router.push(
                requestId
                  ? "/agent/company/requests"
                  : `/agent/company/${companyId}/employees`,
              )
            }
            submitLabel={requestId ? "요청 승인 후 등록" : "등록하기"}
          />
        )}
        {incomeType === "OTHER_INCOME_LABOR" && (
          <OtherIncomeLaborEmployeeForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() =>
              router.push(
                requestId
                  ? "/agent/company/requests"
                  : `/agent/company/${companyId}/employees`,
              )
            }
            submitLabel={requestId ? "요청 승인 후 등록" : "등록하기"}
          />
        )}
      </div>
    </div>
  );
}
