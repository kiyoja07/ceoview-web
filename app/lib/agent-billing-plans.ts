import type { AgentBillingPlanView } from "@/types/agent/billing";

export const AGENT_BILLING_PLANS: AgentBillingPlanView[] = [
  {
    code: "STARTER",
    name: "Starter",
    monthlyPrice: 39000,
    description: "소규모 고객사 운영에 적합한 기본 요금제",
    benefits: [
      "최대 10개 고객사 관리",
      "급여 업로드 월 300건",
      "기본 리포트 대시보드 제공",
      "이메일 문의 지원",
    ],
  },
  {
    code: "GROWTH",
    name: "Growth",
    monthlyPrice: 89000,
    description: "확장 단계의 세무 대리인을 위한 표준 요금제",
    benefits: [
      "최대 50개 고객사 관리",
      "급여 업로드 월 2,000건",
      "고급 리포트 및 내보내기",
      "우선 이메일/채팅 지원",
    ],
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    monthlyPrice: 169000,
    description: "대규모 운영과 전담 지원이 필요한 조직용 요금제",
    benefits: [
      "고객사 수 제한 없음",
      "급여 업로드 무제한",
      "전용 온보딩/운영 컨설팅",
      "전담 CS 및 SLA 지원",
    ],
  },
];
