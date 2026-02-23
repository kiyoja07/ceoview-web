import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { AGENT_BILLING_PLANS } from "@/app/lib/agent-billing-plans";
import type {
  AgentBillingPlanCode,
  BillingInputBody,
} from "@/types/agent/billing";

const PLAN_CODE_SET = new Set(
  AGENT_BILLING_PLANS.map((plan) => plan.code as string),
);

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { agentOrganizationId: user.agentOrganizationId } as const;
}

function detectCardBrand(cardNumber: string) {
  if (/^4/.test(cardNumber)) return "VISA";
  if (/^5[1-5]/.test(cardNumber)) return "MASTERCARD";
  if (/^3[47]/.test(cardNumber)) return "AMEX";
  if (/^35/.test(cardNumber)) return "JCB";
  if (/^(62|81)/.test(cardNumber)) return "UNIONPAY";
  return "ETC";
}

function isValidLuhn(cardNumber: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = Number(cardNumber[i]);
    if (Number.isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const organization = await prisma.agentOrganization.findUnique({
      where: { id: auth.agentOrganizationId },
      select: {
        billing: {
          select: {
            plan: true,
            cardBrand: true,
            cardLast4: true,
            cardExpMonth: true,
            cardExpYear: true,
            cardHolderName: true,
            cardRegisteredAt: true,
            updatedAt: true,
          },
        },
      },
    });
    const billing = organization?.billing ?? null;

    return NextResponse.json({
      plans: AGENT_BILLING_PLANS,
      currentBilling: billing
        ? {
            plan: billing.plan,
            hasCard: Boolean(billing.cardLast4),
            card: billing.cardLast4
              ? {
                  brand: billing.cardBrand,
                  last4: billing.cardLast4,
                  expMonth: billing.cardExpMonth,
                  expYear: billing.cardExpYear,
                  holderName: billing.cardHolderName,
                  registeredAt: billing.cardRegisteredAt,
                }
              : null,
            updatedAt: billing.updatedAt,
          }
        : null,
      disclaimer:
        "현재 요금제 혜택과 결제 연동은 데모 데이터 기반입니다. 실제 과금은 발생하지 않습니다.",
    });
  } catch (error) {
    console.error("Agent billing GET error:", error);
    return NextResponse.json(
      { error: "요금제 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as BillingInputBody;
    const plan = body.plan?.trim().toUpperCase();
    const cardNumber = (body.cardNumber ?? "").replace(/\D/g, "");
    const cardHolderName = body.cardHolderName?.trim() ?? "";
    const expMonth = Number(body.expMonth);
    const expYear = Number(body.expYear);
    const cvc = (body.cvc ?? "").replace(/\D/g, "");

    if (!plan || !PLAN_CODE_SET.has(plan)) {
      return NextResponse.json(
        { error: "유효한 요금제를 선택해주세요." },
        { status: 400 },
      );
    }

    if (cardHolderName.length < 2) {
      return NextResponse.json(
        { error: "카드 소유자명을 입력해주세요." },
        { status: 400 },
      );
    }

    if (cardNumber.length < 14 || cardNumber.length > 19 || !isValidLuhn(cardNumber)) {
      return NextResponse.json(
        { error: "유효한 카드번호를 입력해주세요." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
      return NextResponse.json(
        { error: "유효한 만료월을 입력해주세요." },
        { status: 400 },
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!Number.isInteger(expYear) || expYear < currentYear || expYear > currentYear + 20) {
      return NextResponse.json(
        { error: "유효한 만료년을 입력해주세요." },
        { status: 400 },
      );
    }

    if (expYear === currentYear && expMonth < currentMonth) {
      return NextResponse.json(
        { error: "만료된 카드는 등록할 수 없습니다." },
        { status: 400 },
      );
    }

    if (cvc.length < 3 || cvc.length > 4) {
      return NextResponse.json(
        { error: "유효한 CVC를 입력해주세요." },
        { status: 400 },
      );
    }

    const cardBrand = detectCardBrand(cardNumber);
    const cardLast4 = cardNumber.slice(-4);
    const billingKey = `dummy_billing_${randomUUID().replace(/-/g, "")}`;

    const organization = await prisma.agentOrganization.update({
      where: { id: auth.agentOrganizationId },
      data: {
        billing: {
          upsert: {
            create: {
              plan: plan as AgentBillingPlanCode,
              cardBrand,
              cardLast4,
              cardExpMonth: expMonth,
              cardExpYear: expYear,
              cardHolderName,
              billingKey,
              cardRegisteredAt: new Date(),
            },
            update: {
              plan: plan as AgentBillingPlanCode,
              cardBrand,
              cardLast4,
              cardExpMonth: expMonth,
              cardExpYear: expYear,
              cardHolderName,
              billingKey,
              cardRegisteredAt: new Date(),
            },
          },
        },
      },
      select: {
        billing: {
          select: {
            plan: true,
            cardBrand: true,
            cardLast4: true,
            cardExpMonth: true,
            cardExpYear: true,
            cardHolderName: true,
            cardRegisteredAt: true,
          },
        },
      },
    });
    const saved = organization.billing;

    if (!saved) {
      return NextResponse.json(
        { error: "결제수단 등록 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "카드 등록 및 정기결제 설정이 완료되었습니다.",
      billing: {
        plan: saved.plan,
        card: {
          brand: saved.cardBrand,
          last4: saved.cardLast4,
          expMonth: saved.cardExpMonth,
          expYear: saved.cardExpYear,
          holderName: saved.cardHolderName,
          registeredAt: saved.cardRegisteredAt,
        },
      },
    });
  } catch (error) {
    console.error("Agent billing POST error:", error);
    return NextResponse.json(
      { error: "결제수단 등록 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
