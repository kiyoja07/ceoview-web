# Project instructions

## Project overview

- 서비스 이름: 경영한눈 (https://ceoview.kr)
- 이 레포(`ceoview-web`)는 **화면 전용**이다. API·DB·발송은 `ceoview-backend` 레포가 담당하고, `next.config.ts`의 rewrite로 `/api/*`를 backend(`BACKEND_URL`)로 프록시한다(`docs/repo-split.md`).
- 세무대리인(agent)이 거래처(company)의 직원·급여·재무 정보를 관리하고, 회사 관리자와 직원(employee)이 이를 조회하는 서비스.
- Next.js App Router + React 19 + TypeScript. 스타일은 Tailwind CSS v4.
- 이 레포에는 Prisma·DB 접속 정보·인증 비밀키가 없다. 데이터는 모두 backend API로 가져온다.
- 배포 환경은 Vercel. 환경변수는 Doppler로 주입한다(`npm run dev` 등은 `doppler run --`으로 감싸져 있음).
- 로그인은 magic link 방식(에이전트: 이메일, 회사·직원: 이메일 또는 문자). 링크 유효시간은 전 역할 30분이며 `app/lib/magic-link-ttl.ts` 한 곳에서 관리한다. 세션 쿠키는 HMAC-SHA256 서명 토큰.

## 역할(audience) 구조

- `agent`, `company`, `employee`, `public` 4개 audience가 있다(`types/routing.ts`).
- `proxy.ts`가 서브도메인(host)을 보고 `/agent`, `/company`, `/employee` 내부 경로로 rewrite한다. 화면 코드는 내부 경로 기준으로 작성한다.
- 공개 영역(`public`)은 랜딩(`/`), 쇼케이스(`/showcase/[slug]`), 급여명세서 열람(`/payslip/view`)이다.
  - 급여명세서 열람 페이지(GET)는 1회용 토큰을 확인만 하고, 사용자가 "열람하기" 버튼을 누를 때 `POST /api/public/payslip/view`에서 소진한다. 링크 미리보기·메일 보안 스캐너가 토큰을 소진하지 않게 하기 위함이므로 GET에서 소진하도록 되돌리지 않는다.
- 클라이언트 컴포넌트는 `fetch("/api/...")`로 호출한다(같은 출처, rewrite로 backend에 전달).
- 서버 컴포넌트(레이아웃·페이지)는 `app/lib/backend.ts`의 `backendGet`으로 backend를 호출한다(브라우저 쿠키를 그대로 전달).
  - 레이아웃용 세션 API: `GET /api/agent/session`, `GET /api/company/session`, 직원은 `GET /api/employee/auth/me`·`GET /api/employee/payslips`.
- 인증·접근 제어는 backend가 한다. 화면의 리다이렉트·메뉴 숨김은 사용자 편의일 뿐 보안 경계가 아니다.
- 거래처별 제공 기능(인건비·재무리포트) 켜기/끄기는 `AgentOrganizationCompany`의 플래그(`types/company/features.ts`)로 관리한다. 현재는 회사 화면(`app/company/layout.tsx`, `GET /api/company/session`의 `features`)에서만 막고 API에서는 확인하지 않는다.

## 디렉터리 구조

- `app/agent/**` : 세무대리인 화면. 규칙은 `app/agent/AGENTS.md` 참고.
- `app/company/**` : 회사 관리자 화면.
- `app/employee/**` : 직원 화면.
- `app/lib/**` : 화면 공용 로직(포맷터, 서브도메인 라우팅 `audience-routing.ts`, backend 호출 `backend.ts`). 급여명세서 렌더러(HTML·PDF)는 `app/lib/payslip/`.
- `lib/**` : 라우트와 무관한 작은 유틸(예: `lib/time.ts`).
- `app/_hooks/**` : 전역 공용 React 훅.
- `app/_components/**` : 전역 공용 컴포넌트. 라우트 전용 컴포넌트는 해당 라우트의 `_components/`에 둔다.
- `catalogs/ko/**` : 한국어 라벨·문구 카탈로그. UI 문구는 가능하면 여기서 가져온다. 쇼케이스 샘플 데이터는 `catalogs/showcase/**`.
- `types/**` : API 응답·세션 등 타입 계약. 역할별(`agent/`, `company/`, `employee/`)로 나뉘고, 역할 공통 타입은 루트에 둔다(`routing.ts`, `showcase.ts`, `payslip.ts`).
- `docs/**` : 서비스 안내서(`service-overview.md`), 레포 분리 구조(`repo-split.md`). 운영·연동 가이드는 backend 레포에 있다.
- `_`로 시작하는 라우트 폴더(예: `app/agent/_salary`)는 App Router 규칙상 라우팅되지 않는 비공개 폴더다. 임의로 이름을 바꿔 공개 라우트로 만들지 않는다.
- `app/company/organization/**`의 `page.tsx`는 예전 URL을 `/company/settings/**`, `/company/employees/**`로 보내는 redirect 전용 경로다(아래 "정식 URL" 규칙의 기존 예외). 이 폴더의 `employees/_components/*Form.tsx`는 지급 대상자 등록 화면에서 사용 중이고, `users/_components/InviteCompanyUserModal.tsx`는 현재 어디서도 사용하지 않는다.

## 개발 규칙

- 경로 별칭은 `@/*`(프로젝트 루트)를 사용한다.
- 사용자에게 보이는 메시지는 한국어로 작성한다.
- 미사용 변수는 에러다. 의도적으로 무시할 경우 `_` 접두사를 붙인다.
- 기능별 정식 URL은 하나만 유지한다. 별도 요청이 없으면 alias route, redirect, rewrite를 추가하지 않는다.
- `types/**`, 일부 `catalogs/`, 일부 `app/lib/` 파일은 backend 레포에도 같은 내용으로 있다(`docs/repo-split.md`의 "공용 파일"). 고치면 backend 레포에도 같은 변경을 반영한다.
- 새 환경변수를 추가하면 `README.md`에 반영한다.

## 검증

- 변경 후 `npm run typecheck`와 `npm run lint`를 실행한다.
- 로컬에서는 backend를 `npm run dev`(포트 4000)로 띄우고, 이 레포는 `BACKEND_URL=http://localhost:4000`으로 실행한다.
- 별도의 단위 테스트 프레임워크는 없다. 배포 후 스모크 테스트는 backend 레포의 `npm run smoke`를 사용한다.

## Commands

```bash
npm run dev         # 개발 서버 (doppler run -- next dev)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # next build
```
