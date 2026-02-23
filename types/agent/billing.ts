import type { FormEvent } from "react";

export type AgentBillingPlanCode = "STARTER" | "GROWTH" | "ENTERPRISE";

export type AgentBillingPlanView = {
  code: AgentBillingPlanCode;
  name: string;
  monthlyPrice: number;
  description: string;
  benefits: string[];
};

export type BillingInputBody = {
  plan?: string;
  cardNumber?: string;
  cardHolderName?: string;
  expMonth?: number | string;
  expYear?: number | string;
  cvc?: string;
};

export type BillingCard = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  holderName: string | null;
  registeredAt: string | null;
};

export type CurrentBilling = {
  plan: AgentBillingPlanCode;
  hasCard: boolean;
  card: BillingCard | null;
  updatedAt: string;
} | null;

export type BillingResponse = {
  plans: AgentBillingPlanView[];
  currentBilling: CurrentBilling;
  disclaimer: string;
};

export type BillingSubmitResponse = {
  error?: string;
  message?: string;
  billing?: {
    plan: AgentBillingPlanCode;
    card: BillingCard;
  };
};

export type BillingMessageState = {
  type: "success" | "error";
  text: string;
} | null;

export type PlanSelectorProps = {
  plans: AgentBillingPlanView[];
  selectedPlan: AgentBillingPlanCode | "";
  onSelect: (code: AgentBillingPlanCode) => void;
};

export type CreditCardFormProps = {
  currentCard: BillingCard | null;
  hasCard: boolean;
  cardHolderName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  onCardHolderNameChange: (value: string) => void;
  onCardNumberChange: (value: string) => void;
  onExpMonthChange: (value: string) => void;
  onExpYearChange: (value: string) => void;
  onCvcChange: (value: string) => void;
  submitting: boolean;
  submitDisabled: boolean;
  message: BillingMessageState;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};
