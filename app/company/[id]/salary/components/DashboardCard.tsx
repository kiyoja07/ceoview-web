import { INCOME_META } from "../constants";
import { formatNumber } from "@/app/lib/payslip/format";
import type { IncomeSummary, IncomeTab } from "@/types/company/salary";

interface DashboardCardProps {
  tab: IncomeTab;
  summary: IncomeSummary | null;
  loading: boolean;
  onClick: () => void;
}

export function DashboardCard({
  tab,
  summary,
  loading,
  onClick,
}: DashboardCardProps) {
  const meta = INCOME_META[tab];
  const disabled = !loading && !summary;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-gray-950/5 transition-all ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:shadow-md hover:ring-gray-950/10 active:scale-[0.99]"
      }`}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${meta.gradient} text-white shadow-lg ${meta.shadowColor}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={meta.iconPath}
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{meta.label}</h3>
          {loading ? (
            <p className="text-xs text-gray-400">불러오는 중…</p>
          ) : (
            <p className="text-xs text-gray-400">
              {summary
                ? `${summary.count.toLocaleString()}건`
                : "지급 내역 없음"}
            </p>
          )}
        </div>
        <svg
          className="ml-auto h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      ) : summary ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">총 지급액</span>
            <span className="text-sm font-semibold tabular-nums text-blue-700">
              ₩ {formatNumber(summary.totalPayment)}원
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">총 공제액</span>
            <span className="text-sm font-semibold tabular-nums text-rose-600">
              ₩ {formatNumber(summary.totalDeduction)}원
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="text-xs font-medium text-gray-500">
              차인지급액
            </span>
            <span className="text-base font-bold tabular-nums text-emerald-700">
              ₩ {formatNumber(summary.netPayment)}원
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-sm text-gray-400">지급 내역이 없습니다</p>
        </div>
      )}
    </button>
  );
}
