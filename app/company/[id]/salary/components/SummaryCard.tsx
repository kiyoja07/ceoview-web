import type { ReactNode } from "react";

type SummaryColor = "blue" | "emerald" | "rose";

const COLOR_MAP: Record<SummaryColor, string> = {
  blue: "from-blue-500 to-blue-600 shadow-blue-200",
  emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
  rose: "from-rose-500 to-rose-600 shadow-rose-200",
};

interface SummaryCardProps {
  label: string;
  value: string;
  color: SummaryColor;
  icon: ReactNode;
}

export function SummaryCard({ label, value, color, icon }: SummaryCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${COLOR_MAP[color]} p-5 text-white shadow-lg`}
    >
      <div className="absolute -right-3 -top-3 opacity-10">
        <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={12} />
        </svg>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/20 p-2.5">{icon}</div>
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}원</p>
        </div>
      </div>
    </div>
  );
}
