import type { ReactNode } from "react";

type SummaryCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
  sub?: string;
};

export function SummaryCard({
  label,
  value,
  icon,
  color,
  sub,
}: SummaryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value.toLocaleString()}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-white shadow-sm`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
