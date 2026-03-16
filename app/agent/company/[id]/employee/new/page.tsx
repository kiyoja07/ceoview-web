"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmployeeForm } from "@/app/company/organization/employees/_components/EmployeeForm";

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
  const companyId = params?.id;

  const [authChecked, setAuthChecked] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

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
        const res = await fetch(`/api/agent/company/${companyId}/info`, {
          cache: "no-store",
        });
        if (handleAuthError(res.status)) return;
        if (res.ok) {
          setCompany((await res.json()) as CompanyInfo);
        }
        setAuthChecked(true);
      } catch {
        router.replace("/agent/auth/login");
      }
    };
    void check();
  }, [companyId, handleAuthError, router]);

  const handleSubmit = async (data: {
    name: string;
    residentNumber: string;
    email: string;
    phone: string;
    hireDate: string;
    resignDate: string;
    zipcode: string;
    address: string;
    addressDetail: string;
    bankAccounts: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }[];
  }) => {
    const res = await fetch(`/api/agent/company/${companyId}/employee/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = (await res.json()) as { error?: string; id?: string };
    if (!res.ok) {
      throw new Error(body.error || "직원 등록에 실패했습니다.");
    }

    router.push(`/agent/company/${companyId}/employee`);
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

        <EmployeeForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/agent/company/${companyId}/employee`)}
          submitLabel="등록하기"
        />
      </div>
    </div>
  );
}
