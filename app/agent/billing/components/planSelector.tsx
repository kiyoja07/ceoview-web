"use client";

import type { PlanSelectorProps } from "@/types/agent/billing";

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원 / 월`;
}

export function PlanSelector({
  plans,
  selectedPlan,
  onSelect,
}: PlanSelectorProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">요금제 선택</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <label
            key={plan.code}
            className={`cursor-pointer rounded-2xl border-2 bg-white p-5 shadow-sm transition ${
              selectedPlan === plan.code
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name="plan"
              checked={selectedPlan === plan.code}
              onChange={() => onSelect(plan.code)}
            />
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                {plan.name}
              </h3>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {plan.code}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(plan.monthlyPrice)}
            </p>
            <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
              {plan.benefits.map((benefit) => (
                <li key={benefit}>- {benefit}</li>
              ))}
            </ul>
          </label>
        ))}
      </div>
    </section>
  );
}
