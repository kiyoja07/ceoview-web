import type { ProgramType, ProgramTypeOption } from "@/types/agent/employee";

export function ProgramTypeSelector({
  programType,
  options,
  onChange,
}: {
  programType: ProgramType;
  options: ProgramTypeOption[];
  onChange: (value: ProgramType) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        프로그램 종류 <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const selected = programType === opt.value;
          const disabled = opt.disabled ?? false;

          return (
            <label
              key={opt.value}
              className={`flex items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                disabled
                  ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                  : selected
                    ? "cursor-pointer border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20"
                    : "cursor-pointer border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="programType"
                value={opt.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.label}
              {disabled && (
                <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  준비 중
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
