import BizStatusResult from "./BizStatusResult";
import { INPUT_BASE, formatBusinessNumber } from "./shared";
import type { BizStatusData } from "./shared";
import type { BusinessType } from "@/types/agent/company";

interface BusinessNumberFieldProps {
  businessNumber: string;
  onBusinessNumberChange: (formatted: string) => void;
  onBusinessTypeChange: (type: BusinessType) => void;
  bizValidating: boolean;
  bizStatus: BizStatusData | null;
  bizError: string | null;
  onValidate: () => void;
  onBizStatusReset: () => void;
  showValidateButton?: boolean;
}

export default function BusinessNumberField({
  businessNumber,
  onBusinessNumberChange,
  onBusinessTypeChange,
  bizValidating,
  bizStatus,
  bizError,
  onValidate,
  onBizStatusReset,
  showValidateButton = true,
}: BusinessNumberFieldProps) {
  const digits = businessNumber.replace(/\D/g, "");
  const isValid = digits.length === 10;
  const isContinuingBusiness =
    bizStatus?.b_stt?.includes("계속사업자") ?? false;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        사업자번호 <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={businessNumber}
          onChange={(e) => {
            const formatted = formatBusinessNumber(e.target.value);
            onBusinessNumberChange(formatted);
            onBizStatusReset();
            const d = formatted.replace(/\D/g, "");
            if (d.length >= 5) {
              const mid = Number(d.slice(3, 5));
              onBusinessTypeChange(
                mid >= 80 && mid <= 89 ? "CORPORATION" : "INDIVIDUAL",
              );
            }
          }}
          placeholder="000-00-00000"
          maxLength={12}
          required
          className={`${INPUT_BASE} font-mono tracking-wide`}
        />
        {businessNumber && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <svg
                className="h-4.5 w-4.5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ) : (
              <svg
                className="h-4.5 w-4.5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            )}
          </span>
        )}
      </div>
      {businessNumber && !isValid && (
        <p className="mt-1 text-xs text-amber-600">
          사업자번호 10자리를 모두 입력해주세요.
        </p>
      )}

      {/* 국세청 조회 버튼 */}
      {showValidateButton && isValid && !isContinuingBusiness && (
        <button
          type="button"
          onClick={onValidate}
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
              국세청에 사업자 상태 조회 (필수)
            </>
          )}
        </button>
      )}

      {/* 국세청 조회 결과 */}
      {bizStatus && <BizStatusResult bizStatus={bizStatus} />}

      {/* 국세청 조회 에러 */}
      {bizError && <p className="mt-1.5 text-xs text-red-600">{bizError}</p>}
    </div>
  );
}
