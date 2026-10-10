import type { CompanyFeatureFlags } from "@/types/company/features";

export type CompanySessionPayload = {
  userId: string;
  exp: number;
};

/** GET /api/company/session 응답 (화면 서버 컴포넌트용) */
export type CompanySessionResponse =
  | { authenticated: false }
  | {
      authenticated: true;
      // 접근 가능한 회사가 없으면 null
      company: {
        businessName: string | null;
        features: CompanyFeatureFlags;
      } | null;
      // 온보딩 미완료 회사: "pending"(가입 요청 대기) | "required"(온보딩 필요)
      onboarding: "pending" | "required" | null;
    };
