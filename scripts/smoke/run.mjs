#!/usr/bin/env node
// 경영한눈 스모크 테스트 러너
//
// 배포된 앱(또는 로컬 dev)에 실제 HTTP 요청을 보내 역할별 주요 기능 경로를 점검한다.
// - 의존성 추가 없이 순수 Node(글로벌 fetch/FormData/Blob, node:crypto)와
//   이미 설치된 xlsx 패키지(급여 파싱 fixture 생성)만 사용한다.
// - 하나라도 FAIL이면 exit 1 (CI/배포 게이트용).
//
// 실행:
//   doppler run -- node scripts/smoke/run.mjs --base-url=https://ceoview.kr \
//     --agent-user-id=<id> --company-id=<id> --company-user-id=<id> --employee-user-id=<id>
//
// 세션 쿠키는 app/lib/{agent,company,employee}-auth.ts 의 서명 방식과 동일하게 발급한다.
// (쿠키명/시크릿/payload 구조가 바뀌면 이 스크립트도 갱신해야 함 — 아래 SESSION_SPEC 참고)

import { createHmac } from "node:crypto";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// 인자/환경 파싱
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const BASE_URL = (
  args["base-url"] ||
  process.env.SMOKE_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const AGENT_USER_ID = args["agent-user-id"] || process.env.SMOKE_AGENT_USER_ID;
const COMPANY_ID = args["company-id"] || process.env.SMOKE_COMPANY_ID;
const COMPANY_USER_ID =
  args["company-user-id"] || process.env.SMOKE_COMPANY_USER_ID;
const EMPLOYEE_USER_ID =
  args["employee-user-id"] || process.env.SMOKE_EMPLOYEE_USER_ID;
const SHOWCASE_SLUG =
  args["showcase-slug"] ||
  process.env.SMOKE_SHOWCASE_SLUG ||
  "payroll-operations-demo";
const LIVE_SEND = Boolean(args["live-send"]);
const LIVE_SEND_TO = args["to"] || process.env.SMOKE_LIVE_SEND_TO;

// ---------------------------------------------------------------------------
// 세션 토큰 발급 (app/lib/*-auth.ts 와 동일한 HMAC-SHA256 base64url 서명)
// ---------------------------------------------------------------------------
const SESSION_SPEC = {
  agent: { cookie: "agent_session", secretEnv: "AGENT_AUTH_SECRET", fallback: "local-agent-auth-secret" },
  company: { cookie: "company_session", secretEnv: "COMPANY_AUTH_SECRET", fallback: "local-company-auth-secret" },
  employee: { cookie: "employee_session", secretEnv: "EMPLOYEE_AUTH_SECRET", fallback: "local-employee-auth-secret" },
};
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function mintSessionToken(role, userId) {
  const spec = SESSION_SPEC[role];
  const secret = process.env[spec.secretEnv] || spec.fallback;
  const payload = {
    userId: String(userId),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payloadBase64).digest("base64url");
  return `${payloadBase64}.${signature}`;
}

function cookieHeaderFor(role, userId, extra = {}) {
  const spec = SESSION_SPEC[role];
  const parts = [`${spec.cookie}=${mintSessionToken(role, userId)}`];
  for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${v}`);
  return parts.join("; ");
}

// ---------------------------------------------------------------------------
// 급여 파싱 fixture 생성 (parsers/* 가 인식하는 최소 형태)
// ---------------------------------------------------------------------------
function aoaToXlsxBlob(aoa) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// EARNED_INCOME: earned-income.merged-header.v1 (헤더 0~1행, 데이터 2행~)
function earnedIncomeFixture() {
  // 1행은 비워둔다: 값이 있으면 2행 병합 헤더와 결합돼(예: 급여대장_사원코드)
  // 필수 컬럼명이 어긋난다.
  return aoaToXlsxBlob([
    ["", "", "", "", ""],
    ["사원코드", "사원명", "지급액계", "공제액계", "차인지급액"],
    ["001", "홍길동", 3000000, 300000, 2700000],
  ]);
}
// BUSINESS_INCOME: two-row-grouped (헤더 자동탐지, 데이터 2행 그룹)
function businessIncomeFixture() {
  return aoaToXlsxBlob([
    ["코드", "성   명", "귀속년월", "지급년월", "지급액", "소득세", "차인지급액"],
    ["", "", "", "", "", "", ""],
    ["001", "김사업", "202601", "202601", 1000000, 30000, 970000],
    ["", "", "", "", "", "", ""],
  ]);
}
// OTHER_INCOME: two-row-grouped (헤더 자동탐지, 데이터 2행 그룹)
function otherIncomeFixture() {
  return aoaToXlsxBlob([
    ["코드", "성   명", "소득구분", "귀속년월", "지급년월", "지급액", "소득세", "차인지급액"],
    ["", "", "", "", "", "", "", ""],
    ["001", "이기타", "강연료", "202601", "202601", 500000, 40000, 460000],
    ["", "", "", "", "", "", "", ""],
  ]);
}
// OTHER_INCOME_LABOR: two-row-labor.v1 (메타 6행, 헤더 6~7행, 데이터 8행~ 2행 그룹)
function laborIncomeFixture() {
  return aoaToXlsxBlob([
    ["일용직 급여대장"],
    [""],
    [""],
    [""],
    [""],
    [""],
    ["코드", "성명", "급여총액", "차인지급액"],
    ["", "", "", ""],
    ["001", "박일용", 500000, 495000],
    ["", "", "", ""],
  ]);
}

const SALARY_FIXTURES = [
  { incomeType: "EARNED_INCOME", label: "근로소득", make: earnedIncomeFixture, needsPayDate: true },
  { incomeType: "BUSINESS_INCOME", label: "사업소득", make: businessIncomeFixture },
  { incomeType: "OTHER_INCOME", label: "기타소득", make: otherIncomeFixture },
  { incomeType: "OTHER_INCOME_LABOR", label: "일용소득", make: laborIncomeFixture, noAccrual: true },
];

// ---------------------------------------------------------------------------
// 결과 집계 & 실행 헬퍼
// ---------------------------------------------------------------------------
const results = [];
function record(status, area, name, detail) {
  results.push({ status, area, name, detail });
  const tag = status === "PASS" ? "\x1b[32mPASS\x1b[0m" : status === "FAIL" ? "\x1b[31mFAIL\x1b[0m" : "\x1b[33mSKIP\x1b[0m";
  console.log(`[${tag}] ${area}: ${name}${detail ? ` — ${detail}` : ""}`);
}

async function httpCheck(area, name, url, { expect = 200, headers, method = "GET", body, validate } = {}) {
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { method, headers, body, redirect: "manual" });
    const ms = Date.now() - startedAt;
    const okStatus = Array.isArray(expect) ? expect.includes(res.status) : res.status === expect;
    if (!okStatus) {
      let snippet = "";
      try {
        snippet = (await res.text()).slice(0, 160).replace(/\s+/g, " ");
      } catch {}
      record("FAIL", area, name, `expected ${expect}, got ${res.status} (${ms}ms) ${snippet}`);
      return null;
    }
    if (validate) {
      const problem = await validate(res);
      if (problem) {
        record("FAIL", area, name, `${problem} (${res.status}, ${ms}ms)`);
        return null;
      }
    }
    record("PASS", area, name, `${res.status}, ${ms}ms`);
    return res;
  } catch (error) {
    record("FAIL", area, name, `request error: ${error?.message || error}`);
    return null;
  }
}

async function jsonBody(res) {
  try {
    return await res.clone().json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 체크 정의
// ---------------------------------------------------------------------------
async function run() {
  console.log(`\n경영한눈 스모크 테스트 → ${BASE_URL}\n`);

  // 1. 인프라 (readiness)
  await httpCheck("infra", "GET /api/health/ready", `${BASE_URL}/api/health/ready`, {
    validate: async (res) => {
      const body = await jsonBody(res);
      if (!body) return "JSON 응답 아님";
      if (body.status === "error") return `status=error (db down?)`;
      return null;
    },
  });

  // 2. 공개 랜딩
  await httpCheck("public", "GET /", `${BASE_URL}/`);

  // 3. 공개 쇼케이스
  await httpCheck("public", `GET /api/public/showcase/${SHOWCASE_SLUG}`, `${BASE_URL}/api/public/showcase/${SHOWCASE_SLUG}`, {
    validate: async (res) => {
      const body = await jsonBody(res);
      return body && body.links ? null : "응답에 links 없음";
    },
  });

  // --- Agent 역할 ---
  if (AGENT_USER_ID) {
    const cookie = cookieHeaderFor("agent", AGENT_USER_ID);
    const H = { Cookie: cookie };

    await httpCheck("agent", "GET /api/agent/auth/me", `${BASE_URL}/api/agent/auth/me`, {
      headers: H,
      validate: async (res) => {
        const b = await jsonBody(res);
        return b && b.id ? null : "본인 id 없음";
      },
    });
    await httpCheck("agent", "GET /api/agent/company", `${BASE_URL}/api/agent/company`, { headers: H });
    await httpCheck("agent", "GET /api/agent/salary/dashboard", `${BASE_URL}/api/agent/salary/dashboard`, { headers: H });
    await httpCheck("agent", "GET /api/agent/employee/dashboard", `${BASE_URL}/api/agent/employee/dashboard`, { headers: H });
    await httpCheck("agent", "GET /api/agent/billing", `${BASE_URL}/api/agent/billing`, { headers: H });

    // 9. 급여 엑셀 파싱 (4종, publish 안 함 → save 미전송)
    if (COMPANY_ID) {
      for (const fx of SALARY_FIXTURES) {
        const form = new FormData();
        form.append("file", fx.make(), `smoke-${fx.incomeType}.xlsx`);
        form.append("incomeType", fx.incomeType);
        form.append("companyId", COMPANY_ID);
        if (!fx.noAccrual) form.append("accrualYm", "202601");
        form.append("paymentYm", "202601");
        if (fx.needsPayDate) form.append("payDate", "2026-01-25");
        // save는 전송하지 않음 → 서버에서 save=false (DB 무변경)

        await httpCheck("salary-parse", `POST /api/agent/salary/upload (${fx.label})`, `${BASE_URL}/api/agent/salary/upload`, {
          method: "POST",
          headers: { Cookie: cookie },
          body: form,
          validate: async (res) => {
            const b = await jsonBody(res);
            if (!b) return "JSON 응답 아님";
            if (b.saved) return "save=true (예상치 못한 DB 쓰기)";
            return b.totalRows > 0 ? null : `파싱 행 없음(totalRows=${b.totalRows ?? 0})`;
          },
        });
      }
    } else {
      record("SKIP", "salary-parse", "급여 엑셀 파싱 4종", "--company-id 미지정");
    }
  } else {
    record("SKIP", "agent", "Agent 인증 필요 체크", "--agent-user-id 미지정");
    record("SKIP", "salary-parse", "급여 엑셀 파싱 4종", "--agent-user-id 미지정");
  }

  // --- Company 역할 ---
  if (COMPANY_USER_ID) {
    const extra = COMPANY_ID ? { company_selected_company: COMPANY_ID } : {};
    const H = { Cookie: cookieHeaderFor("company", COMPANY_USER_ID, extra) };

    await httpCheck("company", "GET /api/company/dashboard", `${BASE_URL}/api/company/dashboard`, { headers: H });
    await httpCheck("company", "GET /api/company/employees", `${BASE_URL}/api/company/employees`, { headers: H });
    if (COMPANY_ID) {
      await httpCheck("company", `GET /api/company/${COMPANY_ID}/salary-stats`, `${BASE_URL}/api/company/${COMPANY_ID}/salary-stats`, { headers: H });
    } else {
      record("SKIP", "company", "GET /api/company/{id}/salary-stats", "--company-id 미지정");
    }
  } else {
    record("SKIP", "company", "Company 역할 체크", "--company-user-id 미지정");
  }

  // --- Employee 역할 ---
  if (EMPLOYEE_USER_ID) {
    const H = { Cookie: cookieHeaderFor("employee", EMPLOYEE_USER_ID) };
    await httpCheck("employee", "GET /api/employee/auth/me", `${BASE_URL}/api/employee/auth/me`, { headers: H });
    await httpCheck("employee", "GET /api/employee/profile", `${BASE_URL}/api/employee/profile`, { headers: H });
  } else {
    record("SKIP", "employee", "Employee 역할 체크", "--employee-user-id 미지정");
  }

  // 15. 메시지 연동 — 검증 경로만 확인(실발송 없음): 잘못된 to → 400
  await httpCheck("messages", "POST /api/messages/email (validation)", `${BASE_URL}/api/messages/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: "not-an-email", title: "smoke", body: "smoke" }),
    expect: 400,
  });

  // 옵트인: 실제 이메일 1회 발송(--live-send --to=<주소>)
  if (LIVE_SEND) {
    if (!LIVE_SEND_TO) {
      record("SKIP", "messages", "실이메일 발송", "--to 미지정");
    } else {
      await httpCheck("messages", "POST /api/messages/email (live)", `${BASE_URL}/api/messages/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: LIVE_SEND_TO,
          title: "[경영한눈] 스모크 테스트 발송",
          body: "스모크 테스트에 의한 발송입니다.",
        }),
        expect: 200,
      });
    }
  }

  // 요약
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error("스모크 러너 오류:", error);
  process.exit(1);
});
