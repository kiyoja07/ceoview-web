"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  AgentBillingPlanCode,
  BillingMessageState,
  BillingResponse,
  BillingSubmitResponse,
} from "@/types/agent/billing";
import { PlanSelector } from "./components/planSelector";
import { CreditCardForm } from "./components/creditCardForm";

export default function AgentBillingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<BillingResponse["plans"]>([]);
  const [selectedPlan, setSelectedPlan] = useState<AgentBillingPlanCode | "">(
    "",
  );
  const [disclaimer, setDisclaimer] = useState("");
  const [currentBilling, setCurrentBilling] =
    useState<BillingResponse["currentBilling"]>(null);

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");

  const [message, setMessage] = useState<BillingMessageState>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/agent/billing", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/agent/auth/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/agent/auth/organization");
          return;
        }
        if (!res.ok) {
          throw new Error("요금제 조회 실패");
        }

        const data = (await res.json()) as BillingResponse;
        setPlans(data.plans);
        setCurrentBilling(data.currentBilling);
        setDisclaimer(data.disclaimer);
        setSelectedPlan(data.currentBilling?.plan ?? data.plans[0]?.code ?? "");
      } catch {
        setMessage({
          type: "error",
          text: "요금제 정보를 불러오지 못했습니다.",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchBilling();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agent/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          cardHolderName,
          cardNumber,
          expMonth,
          expYear,
          cvc,
        }),
      });

      const data = (await res.json()) as BillingSubmitResponse;

      if (res.status === 401) {
        router.replace("/agent/auth/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/agent/auth/organization");
        return;
      }

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "카드 등록에 실패했습니다.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: data.message || "카드 등록이 완료되었습니다.",
      });
      const appliedPlan = (data.billing?.plan ||
        selectedPlan) as AgentBillingPlanCode;
      setCurrentBilling((prev) => ({
        plan: appliedPlan,
        hasCard: true,
        card: data.billing?.card ?? prev?.card ?? null,
        updatedAt: new Date().toISOString(),
      }));
      setCvc("");
    } catch {
      setMessage({
        type: "error",
        text: "서버 연결에 실패했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-agent-bg">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div>
            <Link
              href="/agent/company"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
              사업자 목록
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              요금제 및 결제수단
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              요금제를 선택하고 정기 결제에 사용할 신용카드를 등록하세요.
            </p>
          </div>
        </div>

        {disclaimer && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {disclaimer}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">
              요금제 정보를 불러오는 중...
            </p>
          </div>
        ) : (
          <>
            <PlanSelector
              plans={plans}
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
            />

            <CreditCardForm
              currentCard={currentBilling?.card ?? null}
              hasCard={currentBilling?.hasCard ?? false}
              cardHolderName={cardHolderName}
              cardNumber={cardNumber}
              expMonth={expMonth}
              expYear={expYear}
              cvc={cvc}
              onCardHolderNameChange={setCardHolderName}
              onCardNumberChange={setCardNumber}
              onExpMonthChange={setExpMonth}
              onExpYearChange={setExpYear}
              onCvcChange={setCvc}
              submitting={submitting}
              submitDisabled={!selectedPlan}
              message={message}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>
    </div>
  );
}
