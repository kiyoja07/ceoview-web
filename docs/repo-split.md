# 레포 분리 계획: ceoview-backend + ceoview-web

barkiri(`barkiri-backend` + `barkiri-2`)처럼 API와 화면을 별도 레포로 나눈다.
사용자 입장에서 URL·로그인·동작은 바뀌지 않고 코드 위치만 바뀐다.

## 구조

| 레포 | 내용 | 배포 |
| --- | --- | --- |
| `ceoview-backend` | `app/api/**`(엑셀 파서 포함), 서버 `app/lib/**`(인증·접근·발송·급여 통계), `prisma/`, `scripts/`(smoke, wehago 파서) | Vercel 새 프로젝트. 비밀키는 모두 여기 Doppler에 둔다 |
| `ceoview-web` | `app/{agent,company,employee,payslip,showcase}`, `app/_components`, `app/_hooks`, 루트 페이지·레이아웃, `proxy.ts`(서브도메인 rewrite) | 기존 도메인(`ceoview.kr`, `agent.`/`company.`/`employee.`) |

- 웹은 `next.config.ts`의 `rewrites`로 `/api/:path*`를 backend로 넘긴다.
  - 화면의 `fetch("/api/...")`는 고치지 않는다.
  - 같은 출처 요청이므로 CORS가 필요 없다. 세션 쿠키도 지금처럼 서브도메인별 host-only 쿠키로 남는다.
- 화면 서버 컴포넌트는 `app/lib/backend.ts`의 `backendGet`으로 backend를 호출한다.
  - 웹에는 Prisma와 인증 비밀키가 없다.
  - `BACKEND_URL`이 없으면 현재 요청 origin으로 호출한다. 분리 전 단일 앱이 이 경우다.

## 공용 파일 (양쪽 레포에 같은 내용으로 유지)

아래 파일은 두 레포 모두에 있다. 한쪽을 고치면 다른 쪽도 같이 고친다.

- `types/**`
- `catalogs/types.ts`, `catalogs/ko/salary.ts`, `catalogs/ko/employee.ts`, `catalogs/showcase/**`
- `app/lib/payslip/format.ts`, `app/lib/payslip/payslip-template.ts`
- `app/lib/formatters.ts`, `app/lib/magic-link-ttl.ts`, `app/lib/business-type.ts`
- `app/lib/employee-contact.ts`, `app/lib/organization-phone.ts`, `app/lib/payslip-delivery.ts`
- `app/lib/audience-routing.ts`
  - 웹: 서브도메인 rewrite에 쓴다.
  - backend: 매직링크·초대 링크 URL을 만들 때 쓴다.

이 목록은 import 그래프로 뽑았다.
- 화면 쪽(`app/{agent,company,employee,payslip,showcase,_components,_hooks}`, 루트 페이지, `proxy.ts`)에서 import하는 파일
- API 쪽(`app/api/**`)에서 import하는 파일

두 집합에 모두 들어가는 파일이 공용 파일이다. 새 공용 파일이 생기면 여기에 추가한다.

## 진행 단계

0. **분리 전 정리** (ceoview-v1, 완료)
   - 화면↔API 사이 import를 없앴다.
   - 명세서 렌더러는 `app/lib/payslip/`로, 급여 타입은 `types/company/salary.ts`로 옮겼다.
   - 세션 조회 API를 추가했다: `/api/agent/session`, `/api/company/session`, `/api/employee/payslips`, `GET /api/public/payslip/view`.
1. **ceoview-backend 생성**
   - GitHub에 빈 private 레포를 만들고 ceoview-v1의 이력을 그대로 push한다.
   - 화면 폴더, `app/lib/backend.ts`, 화면 전용 의존성(recharts, jspdf, html2canvas-pro, jszip)을 지운다.
   - `proxy.ts`는 `/api/*` 통과만 남긴다.
   - Vercel 새 프로젝트와 Doppler config를 만들고 `/api/health/ready`를 확인한다.
2. **ceoview-web 생성**
   - 빈 레포에 이력을 push한다.
   - 다음을 지운다: `app/api`, `prisma/`, `prisma.config.ts`, 서버 전용 `app/lib`, `@prisma/client`·`prisma`·`xlsx`, `postinstall`.
   - `next.config.ts`에 `/api/:path*` rewrite를 추가하고 `BACKEND_URL`을 설정한다.
   - Preview에서 로그인·급여 대장·명세서 발송/열람·재무리포트·쇼케이스를 확인한다.
3. **전환**
   - 운영 도메인 4개를 ceoview-web 프로젝트로 옮긴다. 직후 `npm run smoke`를 실행한다.
   - 롤백은 도메인을 기존 프로젝트로 되돌리면 된다. DB는 그대로이므로 데이터 이전은 없다.
   - 1~2주 안정화한 뒤 ceoview-v1을 Archive한다.

## 주의

- Vercel Preview에 Deployment Protection(Vercel 인증)이 켜져 있다고 가정한 경우다.
  - 화면 서버 컴포넌트가 같은 Preview 주소로 호출하는 API가 401을 받을 수 있다.
  - 그러면 직원 화면은 로그인으로 돌아가고, 레이아웃 제목은 기본값이 된다.
  - 대응: Vercel 프로젝트 설정 → Deployment Protection → "Protection Bypass for Automation"을 켠다. Vercel이 `VERCEL_AUTOMATION_BYPASS_SECRET`을 넣어 주고, `backendGet`이 이 값을 `x-vercel-protection-bypass` 헤더로 보낸다.
  - 분리 후 web과 backend는 서로 다른 프로젝트다. 그래서 web Preview에서는 `VERCEL_AUTOMATION_BYPASS_SECRET` 대신 `BACKEND_URL`을 backend의 운영 주소로 두는 편이 간단하다.
- 화면 서버 컴포넌트가 backend를 HTTP로 한 번 더 호출하므로, 분리 전 단일 앱에서도 레이아웃 렌더링에 호출 1회분 지연이 생긴다.
