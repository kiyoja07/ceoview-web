import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import pkg from "@/package.json";

// Readiness probe: 트래픽을 받을 준비가 됐는지 확인한다.
// - DB(MongoDB) 연결 여부 (critical)
// - 외부 연동/인증에 필요한 환경변수 그룹 존재 여부 (boolean만, 값은 노출하지 않음)
//
// 판정: DB 실패 → "error"(503). env 그룹 일부 누락 → "degraded"(200). 전부 정상 → "ok"(200).
export const dynamic = "force-dynamic";

// 각 그룹의 필수 env 키. 값 자체는 절대 응답에 담지 않고 존재 여부만 노출한다.
const ENV_GROUPS: Record<string, string[]> = {
  auth: [
    "AGENT_AUTH_SECRET",
    "COMPANY_AUTH_SECRET",
    "EMPLOYEE_AUTH_SECRET",
    "COMPANY_INVITE_SECRET",
    "EMPLOYEE_SIGNUP_GRANT_SECRET",
  ],
  db: ["DATABASE_URL", "MAGIC_LINK_TTL_MINUTES"],
  mail: ["NCLOUD_ACCESS_KEY", "NCLOUD_SECRET_KEY", "NCLOUD_MAIL_SENDER_ADDRESS"],
  sms: ["NCLOUD_SMS_SERVICE_ID", "NCLOUD_SMS_SENDER_NUMBER"],
  kakao: [
    "NCLOUD_KAKAO_SERVICE_ID",
    "KAKAO_PLUS_FRIEND_ID",
    "KAKAO_PAYSLIP_TEMPLATE_CODE",
  ],
  biz: ["BIZ_NUMBER_API_KEY"],
};

function checkEnvGroups() {
  const result: Record<string, boolean> = {};
  const missing: string[] = [];

  for (const [group, keys] of Object.entries(ENV_GROUPS)) {
    const groupOk = keys.every((key) => {
      const present = Boolean(process.env[key] && process.env[key]!.length > 0);
      if (!present) missing.push(key);
      return present;
    });
    result[group] = groupOk;
  }

  return { groups: result, missing };
}

async function checkDb() {
  const startedAt = Date.now();
  try {
    // MongoDB ping. Prisma 기본 export(app/lib/prisma.ts) 재사용.
    await prisma.$runCommandRaw({ ping: 1 });
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export async function GET() {
  const [db, env] = [await checkDb(), checkEnvGroups()];

  const allEnvOk = Object.values(env.groups).every(Boolean);
  const status = !db.ok ? "error" : allEnvOk ? "ok" : "degraded";
  const httpStatus = status === "error" ? 503 : 200;

  return NextResponse.json(
    {
      status,
      checks: {
        db,
        env: env.groups,
        ...(env.missing.length > 0 ? { missingEnv: env.missing } : {}),
      },
      version: pkg.version,
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus },
  );
}
