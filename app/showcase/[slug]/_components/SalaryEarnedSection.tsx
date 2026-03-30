"use client";

import { useMemo, useState } from "react";
import { INCOME_META } from "@/app/company/[id]/salary/constants";
import { SummaryCardsRow } from "@/app/company/[id]/salary/components/SummaryCardsRow";
import YearMonthPicker from "@/app/company/[id]/salary/components/filters/YearMonthPicker";
import { EarnedIncomeTable } from "@/app/company/[id]/salary/components/tables/EarnedIncomeTable";
import {
  IconBuilding,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@/app/company/[id]/salary/components/icons";
import {
  formatBusinessNumber,
  formatNumber,
  formatYm,
} from "@/app/company/[id]/salary/lib/format";
import { shiftYm } from "@/app/company/[id]/salary/lib/navigation";
import { buildEarnedSummary } from "@/app/company/[id]/salary/lib/summary";
import { SectionLabel } from "./ShowcaseUI";
import {
  buildShowcaseEarnedData,
  formatCurrency,
  type ShowcaseScenario,
} from "./showcase-utils";

export default function SalaryEarnedSection({
  scenario,
}: {
  scenario: ShowcaseScenario;
}) {
  const data = useMemo(() => buildShowcaseEarnedData(scenario), [scenario]);
  const summary = useMemo(() => buildEarnedSummary(data), [data]);
  const [accrualInput, setAccrualInput] = useState("202512");
  const [paymentInput, setPaymentInput] = useState("202512");

  const displayedAccrualYm = Number(accrualInput || "202512");
  const displayedPaymentYm = Number(paymentInput || "202512");

  function navigateMonth(delta: number) {
    const nextAccrual = shiftYm(accrualInput, delta);
    const nextPayment = shiftYm(paymentInput, delta);
    setAccrualInput(nextAccrual);
    setPaymentInput(nextPayment);
  }

  return (
    <section id="salary-earned" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          근로 소득 급여 대장
        </h2>
      </div>

      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <div className="min-h-screen bg-app-bg">
          <div className="mx-auto max-w-450 p-6 lg:p-8">
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <IconBuilding />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    급여 대장
                  </h1>
                  <p className="text-sm text-gray-500">
                    {scenario.company.businessName}
                    <span className="mx-1.5 text-gray-300">•</span>
                    <span className="font-mono text-xs text-gray-400">
                      {formatBusinessNumber(
                        scenario.company.businessNumber.replace(/\D/g, ""),
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  title="이전월"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
                >
                  <IconChevronLeft />
                </button>

                <YearMonthPicker
                  label="귀속년월"
                  placeholder="선택하세요"
                  value={accrualInput}
                  onChange={(value) => {
                    setAccrualInput(value);
                    setPaymentInput(value);
                  }}
                />
                <YearMonthPicker
                  label="지급년월"
                  placeholder="선택하세요"
                  value={paymentInput}
                  onChange={setPaymentInput}
                />

                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  title="다음월"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
                >
                  <IconChevronRight />
                </button>

                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98]"
                >
                  <IconSearch />
                  조회
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-900 active:scale-95"
                >
                  <IconChevronLeft />
                  대시보드로 돌아가기
                </button>
                <div
                  className={`flex items-center gap-2 rounded-lg bg-linear-to-r ${INCOME_META.earned.gradient} px-4 py-1.5 text-sm font-semibold text-white shadow-sm`}
                >
                  {INCOME_META.earned.label}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                >
                  급여명세서 전체 발송
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
                >
                  엑셀 다운로드
                </button>
              </div>
            </div>

            {summary && (
              <SummaryCardsRow
                summary={summary}
                toCurrency={(value) => `₩ ${formatNumber(value)}`}
              />
            )}

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
                <div className="text-sm text-gray-500">
                  귀속 {formatYm(displayedAccrualYm)}
                  <span className="mx-2 text-gray-300">•</span>
                  지급 {formatYm(displayedPaymentYm)}
                </div>
                <p className="text-sm text-gray-500">
                  총{" "}
                  <span className="font-semibold text-gray-800">
                    {data.total.toLocaleString()}
                  </span>
                  건
                </p>
              </div>

              <div className="max-h-[calc(100vh-20rem)] overflow-auto">
                <EarnedIncomeTable
                  rows={data.rows}
                  formatYm={formatYm}
                  formatNumber={formatNumber}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-4 text-sm text-slate-600">
              쇼케이스용 읽기 전용 예시 데이터입니다. 이번 달 지급 총액은{" "}
              <span className="font-semibold text-slate-900">
                {formatCurrency(summary?.totalPayment ?? 0)}
              </span>
              , 실지급 총액은{" "}
              <span className="font-semibold text-emerald-700">
                {formatCurrency(summary?.netPayment ?? 0)}
              </span>
              입니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
