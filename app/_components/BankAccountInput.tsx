"use client";

export type BankAccountValue = {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

type BankAccountInputProps = {
  value: BankAccountValue[];
  onChange: (value: BankAccountValue[]) => void;
  disabled?: boolean;
  /** 포커스 링 색상 테마 (기본: emerald) */
  theme?: "emerald" | "blue";
  /** 등록 가능한 최대 계좌 수 */
  maxCount?: number;
};

const BANK_LIST = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "SC제일은행",
  "한국시티은행",
  "케이뱅크",
  "카카오뱅크",
  "토스뱅크",
  "NH농협은행",
  "IBK기업은행",
  "KDB산업은행",
  "수협은행",
  "대구은행",
  "부산은행",
  "경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
  "새마을금고",
  "신협",
  "우체국",
] as const;

const themeColors = {
  emerald: {
    addBtn:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ring: "focus:border-emerald-500 focus:ring-emerald-500",
  },
  blue: {
    addBtn: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    ring: "focus:border-blue-500 focus:ring-blue-500",
  },
} as const;

export default function BankAccountInput({
  value,
  onChange,
  disabled = false,
  theme = "emerald",
  maxCount,
}: BankAccountInputProps) {
  const colors = themeColors[theme];
  const canAdd = maxCount == null || value.length < maxCount;

  const handleAdd = () => {
    onChange([
      ...value,
      { bankName: "", accountNumber: "", accountHolder: "" },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChange = (
    index: number,
    field: keyof BankAccountValue,
    fieldValue: string,
  ) => {
    onChange(
      value.map((ba, i) => (i === index ? { ...ba, [field]: fieldValue } : ba)),
    );
  };

  const inputClass = `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${colors.ring}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">급여 계좌</h2>
        {canAdd && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${colors.addBtn}`}
          >
            + 계좌 추가
          </button>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-gray-400">등록된 계좌가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {value.map((ba, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  계좌 {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    은행
                  </label>
                  <select
                    value={ba.bankName}
                    onChange={(e) =>
                      handleChange(index, "bankName", e.target.value)
                    }
                    className={`bg-white ${inputClass}`}
                    disabled={disabled}
                  >
                    <option value="">은행 선택</option>
                    {BANK_LIST.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ba.accountNumber}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "accountNumber",
                        e.target.value.replace(/\D/g, "").slice(0, 20),
                      )
                    }
                    placeholder="계좌번호 입력"
                    maxLength={20}
                    className={inputClass}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    예금주
                  </label>
                  <input
                    type="text"
                    value={ba.accountHolder}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "accountHolder",
                        e.target.value.slice(0, 10),
                      )
                    }
                    placeholder="예금주명"
                    maxLength={10}
                    className={inputClass}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
