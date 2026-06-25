## 서비스 이름

[경영한눈](https://ceoview.kr)

## Setup

```bash
npx prisma db push
npx prisma generate
```

MongoDB를 사용하므로 `DATABASE_URL`은 `mongodb+srv://...` 형식이어야 합니다.
기존 RDB 마이그레이션은 사용하지 않고 Prisma schema를 `db push`로 반영합니다.

## Auth (Magic Link)

로그인은 이메일 기반 `magic link` 방식.

선택 환경변수:

```bash
NCLOUD_MAIL_SENDER_NAME=관리자 시스템
NCLOUD_MAIL_API_BASE_URL=https://mail.apigw.ntruss.com/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

# 유료 부과 기능

- [ ] 급여 일괄 입금 for 거래처 사장님
- [ ] 동일 월/직원 급여 명세서 발송 최대 3회 for 거래처 사장님

# 런칭 기능/화면에서 제외

- 인건비 지급 대상자 개별 등록 : /agent/company/${companyId}/employees/new

doppler run -- npx prisma generate && doppler run -- npx prisma db push

# 테스트

- company : barkirihouse@gmail.com
