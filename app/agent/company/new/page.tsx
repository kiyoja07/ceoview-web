"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AgentAuthMeResponse, AuthMessageState } from "@/types/agent/auth";
import BusinessRegistrationForm, {
  type BusinessFormValues,
} from "@/app/agent/_components/business-form/BusinessRegistrationForm";
import useBizValidation from "@/app/agent/_components/business-form/useBizValidation";

export default function CompanyNewPage() {
  const router = useRouter();
  const handleBizValidate = useBizValidation();
  const [message, setMessage] = useState<AuthMessageState>(null);

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      if (res.ok) {
        const data = (await res.json()) as Pick<
          AgentAuthMeResponse,
          "hasOrganization"
        >;
        if (!data.hasOrganization) {
          router.replace("/agent/auth/organization");
        }
      }
    };

    void checkSession();
  }, [router]);

  const handleSubmit = useCallback(
    async (values: BusinessFormValues) => {
      try {
        const res = await fetch("/api/agent/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessNumber: values.businessNumber,
            businessType: values.businessType,
            businessName: values.businessName || null,
            representativeName: values.representativeName || null,
            address: values.address || null,
            openingDate: values.openingDate || null,
          }),
        });

        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }

        const data = (await res.json()) as {
          error?: string;
          pendingApproval?: boolean;
          alreadyLinked?: boolean;
        };
        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.error || "등록에 실패했습니다.",
          });
          return;
        }

        if (data.pendingApproval) {
          router.push("/agent/company?requested=1");
          return;
        }

        if (data.alreadyLinked) {
          router.push("/agent/company");
          return;
        }

        router.push("/agent/company?created=1");
      } catch {
        setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
      }
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-agent-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            신규 거래처 등록
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            새로운 거래처 정보를 입력하세요.
          </p>
        </div>

        <BusinessRegistrationForm
          showBizValidation
          onBizValidate={handleBizValidate}
          onSubmit={handleSubmit}
          submitLabel="등록하기"
          loadingLabel="등록 중..."
          message={message}
          onMessageChange={setMessage}
          extraActions={
            <Link
              href="/agent/company"
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              취소
            </Link>
          }
        />
      </div>
    </div>
  );
}
