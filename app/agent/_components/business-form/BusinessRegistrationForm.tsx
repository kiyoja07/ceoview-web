"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { AuthMessageState } from "@/types/agent/auth";
import type { BusinessType } from "@/types/agent/company";
import type { BizStatusData } from "./shared";
import BusinessNumberField from "./BusinessNumberField";
import BusinessTypeSelector from "./BusinessTypeSelector";
import CompanyInfoFields from "./CompanyInfoFields";
import FormMessage from "./FormMessage";

export type BusinessFormValues = {
  businessNumber: string;
  businessType: BusinessType;
  businessName: string;
  representativeName: string;
  address: string;
  openingDate: string;
};

type BusinessRegistrationFormProps = {
  /** 폼 상단에 삽입할 사용자 정의 섹션 */
  beforeSections?: ReactNode;
  /** 국세청 조회 기능 활성화 여부 (company/new에서만 true) */
  showBizValidation?: boolean;
  onBizValidate?: (businessNumber: string) => Promise<BizStatusData | null>;
  /** 폼 제출 콜백 — 성공 시 true를 반환하면 폼 상태를 초기화하지 않음 */
  onSubmit: (values: BusinessFormValues) => Promise<void>;
  /** 제출 버튼 라벨 */
  submitLabel?: string;
  /** 로딩 중 제출 버튼 라벨 */
  loadingLabel?: string;
  /** 제출 버튼 아래 또는 옆에 추가할 추가 액션 (ex: 취소 버튼) */
  extraActions?: ReactNode;
  /** 외부에서 주입하는 메시지 */
  message?: AuthMessageState;
  onMessageChange?: (msg: AuthMessageState) => void;
};

export default function BusinessRegistrationForm({
  beforeSections,
  showBizValidation = false,
  onBizValidate,
  onSubmit,
  submitLabel = "등록하기",
  loadingLabel = "처리 중...",
  extraActions,
  message: externalMessage,
  onMessageChange,
}: BusinessRegistrationFormProps) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [address, setAddress] = useState("");
  const [openingDate, setOpeningDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [internalMessage, setInternalMessage] =
    useState<AuthMessageState>(null);

  // 국세청 조회 상태
  const [bizValidating, setBizValidating] = useState(false);
  const [bizStatus, setBizStatus] = useState<BizStatusData | null>(null);
  const [bizError, setBizError] = useState<string | null>(null);

  const message = externalMessage ?? internalMessage;
  const setMessage = onMessageChange ?? setInternalMessage;

  const digits = businessNumber.replace(/\D/g, "");
  const isValid = digits.length === 10;
  const isTypeAutoDetected = digits.length >= 5;

  // 국세청 조회 통과 여부: showBizValidation이 true이면 b_stt_cd === "01"이어야 제출 가능
  const bizValidationPassed =
    !showBizValidation || bizStatus?.b_stt_cd === "01";

  const handleBizValidate = async () => {
    if (!onBizValidate || !isValid) return;
    setBizValidating(true);
    setBizStatus(null);
    setBizError(null);
    try {
      const result = await onBizValidate(businessNumber);
      if (result) setBizStatus(result);
      else setBizError("조회에 실패했습니다.");
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
      await onSubmit({
        businessNumber,
        businessType,
        businessName,
        representativeName,
        address,
        openingDate,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {beforeSections}

      {/* 필수 정보 */}
      <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          필수 정보
        </legend>
        <div className="space-y-5">
          <BusinessNumberField
            businessNumber={businessNumber}
            onBusinessNumberChange={setBusinessNumber}
            onBusinessTypeChange={setBusinessType}
            bizValidating={showBizValidation ? bizValidating : false}
            bizStatus={showBizValidation ? bizStatus : null}
            bizError={showBizValidation ? bizError : null}
            onValidate={showBizValidation ? handleBizValidate : () => {}}
            onBizStatusReset={handleBizStatusReset}
            showValidateButton={showBizValidation}
          />

          <BusinessTypeSelector
            businessType={businessType}
            onChange={setBusinessType}
            isAutoDetected={isTypeAutoDetected}
          />
        </div>
      </fieldset>

      {/* 선택 정보 */}
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
        {extraActions}
        <button
          type="submit"
          disabled={loading || !isValid || !bizValidationPassed}
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
              {loadingLabel}
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
