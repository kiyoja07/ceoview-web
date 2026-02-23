"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type {
  AgentAuthMeResponse,
  ApiErrorResponse,
  AuthMessageState,
} from "@/types/agent/auth";
import type { BusinessType } from "@/types/agent/company";
import type { BizStatusData } from "./components/shared";
import BusinessNumberField from "./components/BusinessNumberField";
import BusinessTypeSelector from "./components/BusinessTypeSelector";
import CompanyInfoFields from "./components/CompanyInfoFields";
import FormMessage from "./components/FormMessage";

export default function CompanyNewPage() {
  const router = useRouter();

  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [address, setAddress] = useState("");
  const [openingDate, setOpeningDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessageState>(null);

  // 사업자번호 국세청 조회 상태
  const [bizValidating, setBizValidating] = useState(false);
  const [bizStatus, setBizStatus] = useState<BizStatusData | null>(null);
  const [bizError, setBizError] = useState<string | null>(null);

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

  const handleBizValidate = async () => {
    const digits = businessNumber.replace(/\D/g, "");
    if (digits.length !== 10) return;

    setBizValidating(true);
    setBizStatus(null);
    setBizError(null);

    try {
      const res = await fetch("/api/agent/company/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber }),
      });

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setBizError(data.error || "조회에 실패했습니다.");
        return;
      }

      setBizStatus(data);
    } catch {
      setBizError("서버 연결에 실패했습니다.");
    } finally {
      setBizValidating(false);
    }
  };

  const handleBizStatusReset = () => {
    setBizStatus(null);
    setBizError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessNumber,
          businessType,
          businessName: businessName || null,
          representativeName: representativeName || null,
          address: address || null,
          openingDate: openingDate || null,
        }),
      });

      const data = (await res.json()) as ApiErrorResponse;
      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/agent/auth/organization");
        return;
      }
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "등록에 실패했습니다.",
        });
        return;
      }

      router.push("/agent/company?created=1");
    } catch {
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const digits = businessNumber.replace(/\D/g, "");
  const isValid = digits.length === 10;
  const isTypeAutoDetected = digits.length >= 5;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            신규 거래처 등록
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            새로운 거래처 정보를 입력하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 필수 정보 섹션 */}
          <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <legend className="px-2 text-sm font-semibold text-gray-700">
              필수 정보
            </legend>
            <div className="space-y-5">
              <BusinessNumberField
                businessNumber={businessNumber}
                onBusinessNumberChange={setBusinessNumber}
                onBusinessTypeChange={setBusinessType}
                bizValidating={bizValidating}
                bizStatus={bizStatus}
                bizError={bizError}
                onValidate={handleBizValidate}
                onBizStatusReset={handleBizStatusReset}
              />

              <BusinessTypeSelector
                businessType={businessType}
                onChange={setBusinessType}
                isAutoDetected={isTypeAutoDetected}
              />
            </div>
          </fieldset>

          {/* 선택 정보 섹션 */}
          <CompanyInfoFields
            businessName={businessName}
            onBusinessNameChange={setBusinessName}
            representativeName={representativeName}
            onRepresentativeNameChange={setRepresentativeName}
            address={address}
            onAddressChange={setAddress}
            openingDate={openingDate}
            onOpeningDateChange={setOpeningDate}
          />

          {/* 메시지 */}
          <FormMessage message={message} />

          {/* 버튼 영역 */}
          <div className="flex gap-3">
            <Link
              href="/agent/company"
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex-2 cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-400 disabled:shadow-none"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  등록 중...
                </span>
              ) : (
                "등록하기"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
