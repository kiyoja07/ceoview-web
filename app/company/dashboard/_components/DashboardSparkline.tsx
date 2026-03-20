import type { CompanyDashboardSalaryMonth } from "@/types/company/dashboard";

type DashboardSparklineProps = {
  months: CompanyDashboardSalaryMonth[];
};

function formatCompactCurrency(value: number) {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(value >= 1000000000 ? 0 : 1)}억`;
  }
  if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString()}만`;
  }
  return value.toLocaleString();
}

export function DashboardSparkline({ months }: DashboardSparklineProps) {
  if (months.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
        <p className="text-sm text-gray-500">최근 추이를 표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  const width = 320;
  const height = 120;
  const paddingX = 12;
  const paddingY = 14;
  const maxValue = Math.max(...months.map((item) => item.totalPayment), 1);
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = months.map((item, index) => {
    const x =
      paddingX +
      (months.length === 1 ? chartWidth / 2 : (chartWidth * index) / (months.length - 1));
    const y =
      paddingY +
      chartHeight -
      (item.totalPayment / maxValue) * chartHeight;
    return { x, y, ...item };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const latest = months[months.length - 1];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">최근 6개월 급여 추이</p>
          <p className="mt-1 text-xs text-gray-500">
            월별 총 지급액 기준으로 추이를 보여줍니다.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">가장 최근</p>
          <p className="text-sm font-semibold text-gray-900">
            {latest.label} · ₩ {formatCompactCurrency(latest.totalPayment)}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full overflow-visible"
        role="img"
        aria-label="최근 6개월 급여 추이"
      >
        <defs>
          <linearGradient id="dashboard-sparkline" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={height - paddingY}
          y2={height - paddingY}
          stroke="#d1d5db"
          strokeDasharray="4 4"
        />

        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={line}
        />

        {points.map((point) => (
          <g key={point.ym}>
            <circle cx={point.x} cy={point.y} r="4" fill="#10b981" />
            <text
              x={point.x}
              y={height - 2}
              textAnchor="middle"
              className="fill-gray-400 text-[10px]"
            >
              {String(point.ym).slice(4)}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {months.map((month) => (
          <div key={month.ym} className="rounded-xl bg-gray-50 px-2.5 py-2">
            <p className="text-[11px] font-medium text-gray-500">{month.label}</p>
            <p className="mt-1 text-xs font-semibold text-gray-900">
              ₩ {formatCompactCurrency(month.totalPayment)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
