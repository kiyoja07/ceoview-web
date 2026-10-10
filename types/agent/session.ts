export type AgentSessionPayload = {
  userId: string;
  exp: number;
};

/** GET /api/agent/session 응답 (화면 서버 컴포넌트용) */
export type AgentSessionResponse = {
  authenticated: boolean;
  organizationName: string | null;
};
