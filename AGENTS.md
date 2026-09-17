# Project instructions

## Project overview

- 서비스 이름: 경영한눈 (https://ceoview.kr)
- 세무대리인(agent)이 거래처(company)의 직원·급여·재무 정보를 관리하고, 회사 관리자와 직원(employee)이 이를 조회하는 서비스.
- Next.js App Router + React 19 + TypeScript. 스타일은 Tailwind CSS v4.
- 데이터베이스는 MongoDB이며 Prisma로 접근한다. RDB 마이그레이션은 사용하지 않고 `prisma db push`로 스키마를 반영한다.
- 배포 환경은 Vercel. 환경변수는 Doppler로 주입한다(`npm run dev` 등은 `doppler run --`으로 감싸져 있음).
- 로그인은 이메일 magic link 방식. 세션 쿠키는 HMAC-SHA256 서명 토큰.
- 외부 연동: NCloud 메일/SMS/카카오 알림톡, 사업자번호 조회 API.

## 역할(audience) 구조

- `agent`, `company`, `employee`, `public` 4개 audience가 있다(`types/routing.ts`).
- `proxy.ts`가 서브도메인(host)을 보고 `/agent`, `/company`, `/employee` 내부 경로로 rewrite한다. 화면 코드는 내부 경로 기준으로 작성한다.
- 공개 영역(`public`)은 랜딩(`/`), 쇼케이스(`/showcase/[slug]`), 급여명세서 열람(`/payslip/view`)이다.
- 역할별 인증 헬퍼는 `app/lib/{agent,company,employee}-auth.ts`. 회사 소속 확인은 `app/lib/company-access.ts`.

## 디렉터리 구조

- `app/agent/**` : 세무대리인 화면. 규칙은 `app/agent/AGENTS.md` 참고.
- `app/company/**` : 회사 관리자 화면.
- `app/employee/**` : 직원 화면.
- `app/api/**` : Route Handler. 규칙은 `app/api/AGENTS.md` 참고.
- `app/lib/**` : 서버·클라이언트 공용 도메인 로직(인증, 메시지 발송, 급여 통계 등).
- `app/_components/**` : 전역 공용 컴포넌트. 라우트 전용 컴포넌트는 해당 라우트의 `_components/`에 둔다.
- `catalogs/ko/**` : 한국어 라벨·문구 카탈로그. UI 문구는 가능하면 여기서 가져온다.
- `types/**` : API 응답·세션 등 타입 계약. 역할별(`agent/`, `company/`, `employee/`)로 나뉜다.
- `prisma/schema.prisma` : 데이터 모델.
- `scripts/smoke/run.mjs` : 배포 후 스모크 테스트(`docs/health-check.md` 참고).
- `docs/**` : 운영·연동 가이드 문서.
- `_`로 시작하는 라우트 폴더(예: `app/agent/_salary`)는 App Router 규칙상 라우팅되지 않는 비공개 폴더다. 임의로 이름을 바꿔 공개 라우트로 만들지 않는다.

## 개발 규칙

- 경로 별칭은 `@/*`(프로젝트 루트)를 사용한다.
- Prisma 클라이언트는 `@/app/lib/prisma`에서만 가져온다.
- 소프트 삭제 데이터는 `deletedAt: null` 조건을 포함해 조회한다.
- 회사 데이터는 항상 `companyId` 범위로 제한하고, 요청자의 회사·조직 소속을 확인한다.
- 사용자에게 보이는 메시지는 한국어로 작성한다.
- 미사용 변수는 에러다. 의도적으로 무시할 경우 `_` 접두사를 붙인다.
- 기능별 정식 URL은 하나만 유지한다. 별도 요청이 없으면 alias route, redirect, rewrite를 추가하지 않는다.
- 새 환경변수를 추가하면 `app/api/health/ready`의 env 그룹 점검과 `README.md`에 반영한다.
- 세션 쿠키 구조나 급여 파서 양식을 바꾸면 `scripts/smoke/run.mjs`도 함께 갱신한다.

## 검증

- 변경 후 `npm run typecheck`와 `npm run lint`를 실행한다.
- 스키마 변경 시 `npm run db:sync`(Doppler 필요)로 반영한다.
- 별도의 단위 테스트 프레임워크는 없다. 배포 후 확인은 `npm run smoke`를 사용한다.

## Commands

```bash
npm run dev         # 개발 서버 (doppler run -- next dev)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # prisma generate 후 next build
npm run db:sync     # prisma generate + prisma db push
npm run smoke       # 배포된 앱 스모크 테스트
```
