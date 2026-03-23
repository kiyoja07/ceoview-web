import type { ReactNode } from "react";

type Tone = "emerald" | "blue" | "amber" | "slate";

const TONE_STYLES: Record<
  Tone,
  {
    shell: string;
    icon: string;
    value: string;
  }
> = {
  emerald: {
    shell: "border-emerald-200 bg-emerald-50/70",
    icon: "bg-emerald-600 text-white",
    value: "text-emerald-900",
  },
  blue: {
    shell: "border-blue-200 bg-blue-50/70",
    icon: "bg-blue-600 text-white",
    value: "text-blue-900",
  },
  amber: {
    shell: "border-amber-200 bg-amber-50/80",
    icon: "bg-amber-500 text-white",
    value: "text-amber-900",
  },
  slate: {
    shell: "border-gray-200 bg-white",
    icon: "bg-slate-900 text-white",
    value: "text-gray-900",
  },
};

type DashboardMetricCardProps = {
  label: string;
  value: string;
  description?: string;
  tone?: Tone;
  icon: ReactNode;
};

export function DashboardMetricCard({
  label,
  value,
  description,
  tone = "slate",
  icon,
}: DashboardMetricCardProps) {
  const style = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ring-1 ring-gray-950/5 ${style.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${style.value}`}
          >
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {description}
            </p>
          )}
        </div>
        {/* <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${style.icon}`}
        >
          {icon}
        </div> */}
      </div>
    </div>
  );
}
