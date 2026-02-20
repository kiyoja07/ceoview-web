type Props = {
  label: string;
  year: string;
  month: string;
  years: string[];
  months: string[];
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
};

export function YearMonthField({
  label,
  year,
  month,
  years,
  months,
  onYearChange,
  onMonthChange,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
