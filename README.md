## 서비스 이름

[경영한눈](https://ceoview.kr) — web (`ceoview-web`)

## 구조

화면 전용 레포(`ceoview-web`). API·DB는 `ceoview-backend` 레포가 담당하며,
`/api/*` 요청은 `next.config.ts`의 rewrite로 backend에 전달된다. 자세한 구조는 `docs/repo-split.md`.

## 환경변수

```bash
# 필수: ceoview-backend 주소 (예: https://api.ceoview.kr, 로컬은 http://localhost:4000)
BACKEND_URL=
# 서브도메인 라우팅용 (선택, 없으면 접속 host로 추정)
PUBLIC_BASE_URL=https://ceoview.kr
AGENT_BASE_URL=https://agent.ceoview.kr
COMPANY_BASE_URL=https://company.ceoview.kr
EMPLOYEE_BASE_URL=https://employee.ceoview.kr
```

`BACKEND_URL`은 빌드 시점에 rewrite 설정으로 들어가므로 바꾸면 다시 배포해야 한다.

# 유료 부과 기능

- [ ] 급여 일괄 입금 for 거래처 사장님
- [ ] 동일 월/직원 급여 명세서 발송 최대 3회 for 거래처 사장님

# 런칭 기능/화면에서 제외

- 인건비 지급 대상자 개별 등록 : /agent/company/${companyId}/employees/new


# 테스트

- company : barkirihouse@gmail.com
