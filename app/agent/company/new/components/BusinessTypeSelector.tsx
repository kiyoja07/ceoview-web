import type { BusinessType } from "@/types/agent/company";

interface BusinessTypeSelectorProps {
  businessType: BusinessType;
  onChange: (type: BusinessType) => void;
  isAutoDetected: boolean;
}

export default function BusinessTypeSelector({
  businessType,
  onChange,
  isAutoDetected,
}: BusinessTypeSelectorProps) {
  // 사업자 구분은 항상 사업자번호에 의해 자동 결정되므로 수동 변경 불가
  const isDisabled = true;
  const options = [
    { value: "INDIVIDUAL" as const, label: "개인", icon: "👤" },
    { value: "CORPORATION" as const, label: "법인", icon: "🏢" },
  ];

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        사업자구분 <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all cursor-default ${
              businessType === option.value
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20"
                : "border-gray-100 bg-gray-50 opacity-50"
            }`}
          >
            <input
              type="radio"
              name="businessType"
              value={option.value}
              checked={businessType === option.value}
              onChange={() => {}}
              disabled={isDisabled}
              className="sr-only"
            />
            <span className="text-lg">{option.icon}</span>
            <span
              className={`text-sm font-medium ${
                businessType === option.value
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        사업자구분은 사업자번호에 따라 자동 설정됩니다.
      </p>
    </div>
  );
}
