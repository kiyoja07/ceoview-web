import type { ReactNode } from "react";

type SummaryColor = "blue" | "emerald" | "rose" | "orange" | "purple";

const COLOR_MAP: Record<SummaryColor, string> = {
  blue: "from-blue-500 to-blue-600 shadow-blue-200",
  emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
  rose: "from-rose-500 to-rose-600 shadow-rose-200",
  orange: "from-orange-500 to-orange-600 shadow-orange-200",
  purple: "from-purple-500 to-purple-600 shadow-purple-200",
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
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${COLOR_MAP[color]} py-5 px-2 text-white shadow-lg`}
    >
      <div className="absolute -right-3 -top-3 opacity-10">
        <svg className="h-14 w-14" fill="currentColor" viewBox="0 0 14 14">
          <circle cx={10} cy={10} r={10} />
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
