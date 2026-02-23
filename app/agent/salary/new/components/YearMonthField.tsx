import type { YearMonthFieldProps } from "../types";

const selectBase =
  "rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

export function YearMonthField({
  label,
  year,
  month,
  years,
  months,
  onYearChange,
  onMonthChange,
}: YearMonthFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className={selectBase}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className={selectBase}
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
