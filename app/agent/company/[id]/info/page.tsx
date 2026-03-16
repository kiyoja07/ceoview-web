"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BusinessType } from "@/types/agent/company";
import BizStatusResult from "@/app/agent/_components/business-form/BizStatusResult";
import type { BizStatusData } from "@/app/agent/_components/business-form/shared";
import { formatBusinessNumber } from "@/app/agent/_components/business-form/shared";
import DateInput from "@/app/_components/DateInput";
import AddressInput, {
  type AddressValue,
} from "@/app/_components/AddressInput";

type MessageState = { type: "success" | "error"; text: string } | null;

interface CompanyInfo {
  id: string;
  businessNumber: string;
  businessType: BusinessType;
  businessName: string | null;
  representativeName: string | null;
  openingDate: string | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
}

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";
const readOnlyInputBase =
  "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 focus:border-gray-200 focus:ring-0";
const readOnlyDisplayBase =
  "rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500";

export default function AgentCompanyInfoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const companyId = params?.id;

  const [checking, setChecking] = useState(true);
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [addressValue, setAddressValue] = useState<AddressValue>({
    zipcode: "",
    address: "",
    addressDetail: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const [bizValidating, setBizValidating] = useState(false);
  const [bizStatus, setBizStatus] = useState<BizStatusData | null>(null);
  const [bizError, setBizError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const loadCompany = async () => {
      try {
        const res = await fetch(`/api/agent/company/${companyId}/info`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setMessage({
            type: "error",
            text: data.error || "거래처 정보를 불러오지 못했습니다.",
          });
          return;
        }

        const data = (await res.json()) as CompanyInfo;

        setBusinessNumber(formatBusinessNumber(data.businessNumber));
        setBusinessType(data.businessType);
        setBusinessName(data.businessName || "");
        setRepresentativeName(data.representativeName || "");
        setOpeningDate(data.openingDate || "");
        setAddressValue({
          zipcode: data.zipcode || "",
          address: data.address || "",
          addressDetail: data.addressDetail || "",
        });
      } catch {
        setMessage({
          type: "error",
          text: "거래처 정보를 불러오지 못했습니다.",
        });
      } finally {
        setChecking(false);
      }
    };

    void loadCompany();
  }, [companyId, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyId) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/agent/company/${companyId}/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || null,
          representativeName: representativeName || null,
          openingDate: openingDate || null,
          zipcode: addressValue.zipcode || null,
          address: addressValue.address || null,
          addressDetail: addressValue.addressDetail || null,
        }),
      });

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "거래처 정보 수정에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "거래처 정보가 수정되었습니다.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const companyLabel = businessName
    ? `${businessName} (${businessNumber})`
    : businessNumber;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="text-sm text-gray-500">거래처 정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            거래처 정보 관리
          </h1>
          <p className="text-sm text-gray-500">
            거래처의 기본 정보를 조회하고 수정할 수 있습니다.
          </p>
        </div>

        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          onSubmit={handleSubmit}
        >
          {/* 사업자번호 (읽기 전용) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자번호
            </label>
            <input
              type="text"
              value={businessNumber}
              readOnly
              aria-readonly="true"
              className={`${inputBase} ${readOnlyInputBase} font-mono tracking-wide`}
            />
            <p className="mt-1 text-xs text-gray-400">
              사업자번호는 변경할 수 없습니다.
            </p>

            {/* 국세청 조회 버튼 */}
            {businessNumber.replace(/\D/g, "").length === 10 &&
              !bizStatus?.b_stt?.includes("계속사업자") && (
                <button
                  type="button"
                  onClick={async () => {
                    setBizValidating(true);
                    setBizStatus(null);
                    setBizError(null);
                    try {
                      const res = await fetch("/api/agent/company/validate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          businessNumber,
                        }),
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        setBizError(err.error || "조회에 실패했습니다.");
                        return;
                      }
                      const data = await res.json();
                      setBizStatus(data as BizStatusData);
                    } catch {
                      setBizError("서버 연결에 실패했습니다.");
                    } finally {
                      setBizValidating(false);
                    }
                  }}
                  disabled={bizValidating}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bizValidating ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
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
                      조회 중...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                        />
                      </svg>
                      국세청 조회
                    </>
                  )}
                </button>
              )}

            {bizStatus && <BizStatusResult bizStatus={bizStatus} />}
            {bizError && (
              <p className="mt-1.5 text-xs text-red-600">{bizError}</p>
            )}
          </div>

          {/* 사업자구분 (자동 설정, 읽기 전용) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              사업자구분
            </label>
            <div className={readOnlyDisplayBase}>
              {businessType === "INDIVIDUAL" ? "개인" : "법인"}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              사업자구분은 사업자번호에 따라 자동 설정됩니다.
            </p>
          </div>

          {/* 상호명 / 대표자명 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                상호명
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="거래처 상호명"
                className={inputBase}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                대표자명
              </label>
              <input
                type="text"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder="홍길동"
                className={inputBase}
              />
            </div>
          </div>

          {/* 개업일 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              개업일
            </label>
            <DateInput
              value={openingDate}
              onChange={setOpeningDate}
              theme="blue"
            />
          </div>

          {/* 주소 */}
          <AddressInput
            value={addressValue}
            onChange={setAddressValue}
            theme="blue"
          />

          {/* 메시지 */}
          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "저장 중..." : "거래처 정보 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
