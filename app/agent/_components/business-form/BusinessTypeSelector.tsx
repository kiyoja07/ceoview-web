import type { BusinessType } from "@/types/agent/company";

interface BusinessTypeSelectorProps {
  businessType: BusinessType;
  onChange: (type: BusinessType) => void;
  isAutoDetected: boolean;
}

const config: Record<BusinessType, { label: string; icon: string }> = {
  INDIVIDUAL: { label: "개인사업자", icon: "👤" },
  CORPORATION: { label: "법인사업자", icon: "🏢" },
};

export default function BusinessTypeSelector({
  businessType,
  isAutoDetected,
}: BusinessTypeSelectorProps) {
  if (!isAutoDetected) return null;

  const { label, icon } = config[businessType];

  return (
    <div>
      <div className="mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          사업자구분
        </label>
        <p className="text-xs text-gray-400">
          사업자번호에 맞춰 자동으로 선택됩니다
        </p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-blue-700">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
