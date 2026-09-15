"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/app/_components/ui/PageState";
import type {
  AgentAuthMeResponse,
  ApiErrorResponse,
  AuthMessageState,
} from "@/types/agent/auth";
import BusinessRegistrationForm, {
  type BusinessFormValues,
} from "@/app/agent/company/new/_components/BusinessRegistrationForm";
import useBizValidation from "@/app/agent/_components/business-form/useBizValidation";
import PhoneInput from "@/app/_components/PhoneInput";
import { validateOrganizationPhone } from "@/app/lib/organization-phone";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

export default function AgentOrganizationCreatePage() {
  const router = useRouter();

  const handleBizValidate = useBizValidation();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationPhone, setOrganizationPhone] = useState("");
  const [message, setMessage] = useState<AuthMessageState>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/agent/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/agent/auth/login");
          return;
        }

        const data = (await res.json()) as Pick<
          AgentAuthMeResponse,
          "email" | "name" | "phone" | "hasOrganization"
        >;
        if (data.hasOrganization) {
          router.replace("/agent/company");
          return;
        }

        setEmail(data.email);
        setName(data.name);
        setPhone(data.phone || "");
      } finally {
        setChecking(false);
      }
    };

    void checkSession();
  }, [router]);

  const handleSubmit = useCallback(
    async (values: BusinessFormValues) => {
      const organizationPhoneError =
        validateOrganizationPhone(organizationPhone);
      if (organizationPhoneError) {
        setMessage({
          type: "error",
          text: organizationPhoneError,
        });
        return;
      }

      try {
        const res = await fetch("/api/agent/auth/organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationNumber: values.businessNumber,
            businessType: values.businessType,
            organizationName: values.businessName || null,
            representativeName: values.representativeName || null,
            phone: organizationPhone || null,
            openingDate: values.openingDate || null,
            address: values.address || null,
            userName: name,
            userPhone: phone,
          }),
        });

        const data = (await res.json()) as ApiErrorResponse;
        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.error || "세무대리인 조직 생성에 실패했습니다.",
          });
          return;
        }

        setMessage({
          type: "success",
          text: "세무대리인 조직이 생성되었습니다. 이동 중입니다.",
        });
        router.replace("/agent/company");
      } catch {
        setMessage({
          type: "error",
          text: "서버 연결에 실패했습니다.",
        });
      }
    },
    [router, name, phone, organizationPhone],
  );

  if (checking) {
    return <PageLoading message="세션 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6 flex items-sta rt justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              세무대리인 및 소속 회사 등록
            </h1>
            <p className="mt-1 text-sm text-gray-500">가입 완료: ({email})</p>
            <p className="text-sm mt-2 text-gray-500">
              서비스 이용을 위해 세무대리인 및 소속 회사를 등록해주세요.
            </p>
          </div>
        </div>

        <BusinessRegistrationForm
          showBizValidation
          onBizValidate={handleBizValidate}
          onSubmit={handleSubmit}
          submitLabel="세무대리인 소속 회사 생성"
          loadingLabel="생성 중..."
          message={message}
          onMessageChange={setMessage}
          beforeSections={
            <>
              <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-800">
                  내 정보 (선택)
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      이름
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="홍길동"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      휴대폰 번호
                    </label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      theme="blue"
                    />
                  </div>
                </div>
              </section>
              <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-800">
                  조직 연락처 (선택)
                </h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    대표 전화번호
                  </label>
                  <input
                    type="tel"
                    value={organizationPhone}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const digits = nextValue.replace(/\D/g, "");
                      setOrganizationPhone(digits ? nextValue : "");
                    }}
                    placeholder="02-1234-5678"
                    className={inputBase}
                    maxLength={30}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    거래처 회사 화면에 담당 세무대리인 연락처로 표시됩니다.
                  </p>
                </div>
              </section>
            </>
          }
        />
      </div>
    </div>
  );
}
