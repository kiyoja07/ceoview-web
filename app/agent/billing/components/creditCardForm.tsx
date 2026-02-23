"use client";

import { useMemo } from "react";
import type { CreditCardFormProps } from "@/types/agent/billing";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function CreditCardForm({
  currentCard,
  hasCard,
  cardHolderName,
  cardNumber,
  expMonth,
  expYear,
  cvc,
  onCardHolderNameChange,
  onCardNumberChange,
  onExpMonthChange,
  onExpYearChange,
  onCvcChange,
  submitting,
  submitDisabled,
  message,
  onSubmit,
}: CreditCardFormProps) {
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => String(now + i));
  }, []);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        신용카드 등록
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        선택한 요금제에 대한 월 정기결제를 위해 카드를 등록합니다.
      </p>

      {hasCard && currentCard && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          현재 등록 카드: {currentCard.brand || "CARD"} •••• {currentCard.last4}{" "}
          (만료 {currentCard.expMonth}/{currentCard.expYear})
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            카드 소유자명
          </label>
          <input
            type="text"
            required
            value={cardHolderName}
            onChange={(e) => onCardHolderNameChange(e.target.value)}
            className={inputBase}
            placeholder="홍길동"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            카드번호
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={cardNumber}
            onChange={(e) =>
              onCardNumberChange(formatCardNumber(e.target.value))
            }
            className={`${inputBase} font-mono tracking-wide`}
            placeholder="0000 0000 0000 0000"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              만료월
            </label>
            <select
              required
              value={expMonth}
              onChange={(e) => onExpMonthChange(e.target.value)}
              className={inputBase}
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                <option key={m} value={m}>
                  {m.padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              만료년
            </label>
            <select
              required
              value={expYear}
              onChange={(e) => onExpYearChange(e.target.value)}
              className={inputBase}
            >
              <option value="">년</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              CVC
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              maxLength={4}
              value={cvc}
              onChange={(e) =>
                onCvcChange(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className={`${inputBase} font-mono`}
              placeholder="000"
            />
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitDisabled || submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {submitting ? "등록 중..." : "카드 등록 및 정기결제 설정"}
        </button>
      </form>
    </section>
  );
}
