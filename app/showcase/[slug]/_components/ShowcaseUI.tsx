export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
      {children}
    </p>
  );
}

export function StaticFieldList({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SummaryStatCard({
  label,
  value,
  colorClassName,
  icon,
}: {
  label: string;
  value: string;
  colorClassName: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${colorClassName} p-5 text-white shadow-lg`}
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
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function ArrowTileIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}
