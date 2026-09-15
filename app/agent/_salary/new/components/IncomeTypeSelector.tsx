import type { IncomeTypeSelectorProps } from "../types";

export function IncomeTypeSelector({
  incomeType,
  options,
  onChange,
}: IncomeTypeSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        소득유형 <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((type) => (
          <label
            key={type.value}
            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
              incomeType === type.value
                ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="incomeType"
              value={type.value}
              checked={incomeType === type.value}
              onChange={() => onChange(type.value)}
              className="sr-only"
            />
            {type.label}
          </label>
        ))}
      </div>
    </div>
  );
}
