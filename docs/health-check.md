# 헬스체크 & 스모크 테스트

경영한눈의 주요 기능 정상 작동 여부를 배포 직후 빠르게 확인하기 위한 두 가지 수단.

## 1. 헬스체크 API

### `GET /api/health` — Liveness

프로세스 생존만 확인한다. DB/외부 연동 접근 없이 항상 `200`.

```json
{ "status": "ok", "version": "0.1.0", "timestamp": "2026-07-09T00:00:00.000Z" }
```

로드밸런서/컨테이너 오케스트레이터의 liveness probe 로 사용한다.

### `GET /api/health/ready` — Readiness

트래픽을 받을 준비가 됐는지 확인한다.

- **DB(MongoDB)** 연결 여부 (critical) — `prisma.$runCommandRaw({ ping: 1 })`
- **환경변수 그룹** 존재 여부 (boolean만, 값은 노출하지 않음): `auth`, `db`, `mail`, `sms`, `kakao`, `biz`

판정:

| 조건 | status | HTTP |
|------|--------|------|
| DB 실패 | `error` | 503 |
| env 그룹 일부 누락 | `degraded` | 200 |
| 전부 정상 | `ok` | 200 |

```json
{
  "status": "degraded",
  "checks": {
    "db": { "ok": true, "latencyMs": 12 },
    "env": { "auth": true, "db": true, "mail": true, "sms": true, "kakao": false, "biz": true },
    "missingEnv": ["KAKAO_PLUS_FRIEND_ID", "KAKAO_PAYSLIP_TEMPLATE_CODE"]
  },
  "version": "0.1.0",
  "timestamp": "..."
}
```

> 시크릿 값 자체는 절대 응답에 담기지 않는다(존재 여부 boolean만).

## 2. 스모크 테스트

`scripts/smoke/run.mjs` — 배포된 앱에 실제 HTTP 요청을 보내 역할별 주요 기능 경로를 점검한다.
의존성 추가 없이 순수 Node + 이미 설치된 `xlsx`(급여 파싱 fixture 생성)만 사용한다.

### 실행

```bash
npm run smoke -- \
  --base-url=https://ceoview.kr \
  --agent-user-id=<AgentUser.id> \
  --company-id=<Company.id> \
  --company-user-id=<CompanyUser.id> \
  --employee-user-id=<EmployeeUser.id>
```

인자는 env 로도 지정 가능: `SMOKE_BASE_URL`, `SMOKE_AGENT_USER_ID`, `SMOKE_COMPANY_ID`,
`SMOKE_COMPANY_USER_ID`, `SMOKE_EMPLOYEE_USER_ID`, `SMOKE_SHOWCASE_SLUG`.

id 를 주지 않으면 해당 역할 체크는 `SKIP` 된다(공개 경로/헬스체크는 항상 수행). **하나라도
`FAIL` 이면 exit 1** 이라 CI/배포 파이프라인의 게이트로 쓸 수 있다.

### 동작 방식

- 세션 쿠키는 `app/lib/{agent,company,employee}-auth.ts` 와 **동일한 HMAC-SHA256 서명**으로
  직접 발급 → 이메일 매직링크 왕복 없이 인증 API 검증. (시크릿은 Doppler 에서 주입)
- 급여 업로드는 `save` 를 전송하지 않아 **파싱 프리뷰만** 받고 DB 는 건드리지 않는다.
- 메시지 연동(`/api/messages/*`)은 에이전트 세션이 필요하다. 미인증 요청이 401로 차단되는지,
  에이전트 세션으로 **검증 경로만**(잘못된 수신자 → 400) 확인한다. 실제 발송은
  `--live-send --to=<주소>` 옵트인 시 1회만(`--agent-user-id` 필요).
- 회사 급여 API(`/api/company/{id}/earned-income`, `payslip-send`)가 미인증 요청을 401로
  차단하는지 확인한다(`--company-id` 필요).
- 급여명세서 열람 API(`POST /api/public/payslip/view`)는 잘못된 토큰 → 404만 확인한다.
- 파괴적 쓰기는 기본 제외.

### 점검 항목

인프라(readiness), 공개 랜딩/쇼케이스, Agent(인증·거래처·급여/직원 대시보드·과금·급여 4종 파싱),
Company(대시보드·직원·변경요청·급여통계), Employee(인증·프로필), 메시지 연동, 미인증 차단, 급여명세서 열람 API.

> 주의: 세션 쿠키명/시크릿/payload 구조나 급여 파서 양식이 바뀌면 `run.mjs` 도 함께 갱신해야 한다.
