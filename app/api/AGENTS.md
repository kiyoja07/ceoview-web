# API 개발

- `app/api/**/route.ts`에 Route Handler로 구현하고 `NextResponse.json()`을 사용한다.
- 기존 인증 헬퍼(회사·에이전트·직원)를 사용하고, 회사/조직 소속까지 확인한다.
  - `/api/company/[id]/**` 급여(인건비)·명세서 발송: `authorizeCompanySalaryAccess` (`app/lib/company-salary-access.ts`)
  - `/api/company/[id]/**` 재무리포트: `authorizeFinancialReportView` (`app/lib/financial-report-access.ts`)
  - `/api/messages/*`: `authorizeMessageApiRequest` (`app/lib/messages/api-auth.ts`, 활성 에이전트만)
  - 경로의 `[id]`만 보고 데이터를 내주지 않는다. 새 라우트는 위 헬퍼나 같은 수준의 소속 확인을 반드시 거친다.
- 로그인 없이 호출되는 것이 의도된 라우트는 `/api/health/*`, `/api/public/*`(쇼케이스, 급여명세서 열람 `GET`(사용 가능 여부만)·`POST`(소진) `/api/public/payslip/view`), `agent/session`·`company/session`(로그인하지 않았으면 `authenticated: false`만 반환), 역할별 `auth/*`(로그인·매직링크·가입), `employee/auth/signup-from-payslip`(서명된 가입 grant로 검증), `agent/users/invite/accept`(초대 토큰으로 검증)뿐이다. 이 목록 밖의 라우트를 공개로 만들지 않는다.
- 1회용 토큰(매직링크·급여명세서 열람)은 GET에서 소진하지 않고 POST에서 소진한다.
- 비어 있을 수 있는 필드의 중복은 DB 고유 제약에 기대지 않고 코드에서 확인한다(루트 `AGENTS.md`의 스키마 규칙 참고). 예: 사원코드 `isEmployeeCodeTaken`, 직원 계정 연락처 `findEmployeeUserContactConflict`. 중복이면 409를 반환한다.
- 입력은 검증·정규화한다. 회사 데이터는 `companyId`, 소프트 삭제 데이터는 `deletedAt: null` 조건을 포함한다.
- Prisma는 `@/app/lib/prisma`만 사용한다. 다중 변경은 트랜잭션으로 묶는다.
- `id`와 날짜는 JSON 안전하게 직렬화하고, 기존 `types/` 응답 계약을 유지한다.
- `400/401/403/404/409/500`을 상황에 맞게 반환한다. 서버에는 오류를 기록하고 클라이언트에는 안전한 한국어 메시지를 준다.
- 성공·인증·권한·입력 오류를 확인하고 `npm run typecheck` 또는 `npm run lint`를 실행한다.
