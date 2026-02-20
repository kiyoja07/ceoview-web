"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyStat } from "../types";

interface MonthlyStatsChartProps {
  stats: MonthlyStat[];
  months: number;
  onMonthsChange: (months: number) => void;
}

const MONTH_OPTIONS = [6, 12, 24] as const;

/** 금액을 축약 표시 (억·만) */
function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_0000_0000)
    return `${(value / 1_0000_0000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}억`;
  if (abs >= 1_0000)
    return `${(value / 1_0000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}만`;
  return value.toLocaleString();
}

/** 금액을 콤마 포함 원 단위로 표시 */
function fullCurrency(value: number): string {
  return `₩ ${value.toLocaleString()}`;
}

/** 커스텀 툴팁 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">{entry.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-gray-800">
            {fullCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyStatsChart({
  stats,
  months,
  onMonthsChange,
}: MonthlyStatsChartProps) {
  const hasData = stats.some(
    (s) =>
      s.earnedPayment > 0 ||
      s.businessPayment > 0 ||
      s.dailyPayment > 0 ||
      s.otherPayment > 0,
  );

  return (
    <div className="my-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      {/* 헤더 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">월별 급여 현황</h2>
          <p className="text-sm text-gray-400">
            최근 {months}개월 소득유형별 지급액 누적
          </p>
        </div>

        {/* 기간 선택 버튼 */}
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {MONTH_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onMonthsChange(opt)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                months === opt
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt}개월
            </button>
          ))}
        </div>
      </div>

      {/* 차트 */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={stats}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={compactCurrency}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59,130,246,0.04)" }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
            />
            <Bar
              dataKey="earnedPayment"
              name="근로소득"
              fill="#3b82f6"
              stackId="income"
            />
            <Bar
              dataKey="businessPayment"
              name="사업소득"
              fill="#6366f1"
              stackId="income"
            />
            <Bar
              dataKey="dailyPayment"
              name="일용직소득"
              fill="#10b981"
              stackId="income"
            />
            <Bar
              dataKey="otherPayment"
              name="기타소득"
              fill="#f59e0b"
              stackId="income"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-90 items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
            <p className="mt-3 text-sm text-gray-400">
              해당 기간에 급여 데이터가 없습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
