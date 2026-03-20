"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmployeeForm } from "../organization/employees/_components/EmployeeForm";

export default function NewEmployeePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

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

  const handleSubmit = async (data: {
    name: string;
    residentNumber: string;
    email: string;
    phone: string;
    zipcode: string;
    address: string;
    addressDetail: string;
    bankAccounts: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }[];
  }) => {
    const res = await fetch("/api/company/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = (await res.json()) as { error?: string; id?: string };
    if (!res.ok) {
      throw new Error(body.error || "직원 등록에 실패했습니다.");
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

        <EmployeeForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/company/employees")}
          submitLabel="등록하기"
        />
      </div>
    </div>
  );
}
