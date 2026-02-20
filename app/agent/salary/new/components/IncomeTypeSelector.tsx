import type { IncomeType } from "../types";

type Option = {
  value: IncomeType;
  label: string;
};

type Props = {
  incomeType: IncomeType;
  options: Option[];
  onChange: (value: IncomeType) => void;
};

export function IncomeTypeSelector({ incomeType, options, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        소득유형 <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-4">
        {options.map((type) => (
          <label key={type.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="incomeType"
              value={type.value}
              checked={incomeType === type.value}
              onChange={() => onChange(type.value)}
              className="accent-blue-500"
            />
            <span className="text-sm">{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
