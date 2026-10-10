# 레포 분리 구조: ceoview-backend + ceoview-web

barkiri(`barkiri-backend` + `barkiri-2`)처럼 API와 화면을 별도 레포로 나눈다.
사용자 입장에서 URL·로그인·동작은 바뀌지 않고 코드 위치만 바뀐다.

## 구조

| 레포 | 내용 | 배포 |
| --- | --- | --- |
| `ceoview-backend` | `app/api/**`(엑셀 파서 포함), 서버 `app/lib/**`(인증·접근·발송·급여 통계), `prisma/`, `scripts/`(smoke, wehago 파서) | Vercel 새 프로젝트, 예: `api.ceoview.kr`. DB·비밀키는 모두 여기 Doppler에 둔다 |
| `ceoview-web` | `app/{agent,company,employee,payslip,showcase}`, `app/_components`, `app/_hooks`, 루트 페이지·레이아웃, `proxy.ts`(서브도메인 rewrite) | 기존 도메인 `ceoview.kr`, `agent.`/`company.`/`employee.` |

```
브라우저 ──▶ agent.ceoview.kr (ceoview-web)
               ├─ 화면: proxy.ts가 /agent/** 로 rewrite
               └─ /api/*: next.config.ts rewrite ──▶ ceoview-backend (BACKEND_URL)
```

### 웹이 `/api/*` 요청을 backend로 프록시한다
- `next.config.ts`의 `rewrites`가 이 일을 한다.
- 화면의 `fetch("/api/...")`는 같은 출처 요청이므로 CORS가 필요 없다.
- backend가 내려주는 세션 쿠키(`domain` 없음)는 브라우저가 접속한 서브도메인의 쿠키로 저장된다. 쿠키 구조는 바뀌지 않는다.
- 서버 컴포넌트는 `app/lib/backend.ts`의 `backendGet`으로 `BACKEND_URL`을 직접 호출한다. 이때 브라우저 쿠키를 그대로 전달한다.

### backend는 브라우저가 접속한 호스트를 모른다
- 리다이렉트는 `redirectToPath`(`app/lib/http-redirect.ts`)로 **상대 경로**만 쓴다.
- 메일·문자 링크는 env의 base URL로 만든다.
  - 해당 변수: `PUBLIC_BASE_URL`, `AGENT_BASE_URL`, `COMPANY_BASE_URL`, `EMPLOYEE_BASE_URL`
  - 누락되면 `/api/health/ready`가 `degraded`를 반환한다.

## 공용 파일 (양쪽 레포에 같은 내용으로 유지)

아래 파일은 두 레포 모두에 있다. 한쪽을 고치면 다른 쪽도 같이 고친다.

- `types/**`
- `catalogs/types.ts`, `catalogs/ko/salary.ts`, `catalogs/ko/employee.ts`, `catalogs/showcase/**`
- `app/lib/payslip/format.ts`, `app/lib/payslip/payslip-template.ts`
- `app/lib/formatters.ts`, `app/lib/magic-link-ttl.ts`, `app/lib/business-type.ts`
- `app/lib/employee-contact.ts`, `app/lib/organization-phone.ts`, `app/lib/payslip-delivery.ts`
- `app/lib/audience-routing.ts`
  - web: 서브도메인 rewrite에 쓴다.
  - backend: 메일 링크 URL을 만들 때 쓴다.

API 응답 형태(`types/`)를 바꿀 때는 호환되는 순서로 배포한다.
1. backend가 옛 형태와 새 형태를 함께 지원하게 배포한다.
2. web을 배포한다.
3. backend에서 옛 형태를 정리한다.

## 배포·전환 체크리스트

1. GitHub
   - private 레포 `kiyoja07/ceoview-backend`, `kiyoja07/ceoview-web`을 만들고 각 코드를 push한다.
2. Doppler
   - 기존 ceoview config를 복사해 `ceoview-backend` config를 만든다(DB, 인증 비밀키, NCloud 등 전부).
   - 링크 주소 4개를 추가한다: `PUBLIC_BASE_URL`, `AGENT_BASE_URL`, `COMPANY_BASE_URL`, `EMPLOYEE_BASE_URL`.
   - `ceoview-web` config에는 `BACKEND_URL`만 둔다(선택: 링크 주소 4개).
3. Vercel: backend
   - 새 프로젝트 `ceoview-backend`를 만들고 GitHub 레포와 Doppler를 연결한다.
   - 커스텀 도메인 `api.ceoview.kr`을 붙인다. Vercel 배포 보호가 켜져 있으면 `*.vercel.app` 주소는 막히기 때문이다.
   - `https://api.ceoview.kr/api/health/ready`가 `ok`인지 확인한다.
4. Vercel: web
   - 새 프로젝트 `ceoview-web`을 만들고 `BACKEND_URL=https://api.ceoview.kr`을 설정한다.
   - Preview에서 다음을 확인한다: 3개 역할 로그인, 급여 대장, 명세서 발송·열람, 재무리포트 업로드·게시, 쇼케이스.
5. 전환
   - 기존 `ceoview` 프로젝트의 도메인 `ceoview.kr`, `agent.`/`company.`/`employee.ceoview.kr`을 `ceoview-web` 프로젝트로 옮긴다.
   - 직후 backend 레포에서 `npm run smoke -- --base-url=https://ceoview.kr`를 실행한다.
6. 롤백·정리
   - 롤백은 도메인을 기존 `ceoview` 프로젝트로 되돌리면 된다. DB는 그대로이므로 데이터 이전은 없다.
   - 1~2주 안정화한 뒤 `ceoview-v1`을 Archive한다.

## 주의

- `BACKEND_URL`은 빌드 시점에 rewrite 설정으로 들어간다. 바꾸면 web을 다시 배포한다.
- 화면 서버 컴포넌트가 backend를 HTTP로 한 번 더 호출하므로, 레이아웃 렌더링에 호출 1회분 지연이 생긴다.
- 분리 전 단일 앱(ceoview-v1)에서는 `BACKEND_URL` 없이 현재 요청 origin으로 자기 자신을 호출한다.
  - Vercel Preview에 배포 보호가 켜져 있으면 이 호출이 401을 받을 수 있다.
  - 대응: "Protection Bypass for Automation"을 켜면 `VERCEL_AUTOMATION_BYPASS_SECRET` 헤더로 통과한다(ceoview-v1에만 해당).
