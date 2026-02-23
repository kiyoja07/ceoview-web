## Setup

```bash
npx prisma generate && npx prisma db push
```

## Auth (Magic Link)

로그인은 이메일 기반 `magic link` 방식입니다.

필수 환경변수:

```bash
AGENT_AUTH_SECRET=change-me
APP_BASE_URL=http://localhost:3000

NCLOUD_ACCESS_KEY=...
NCLOUD_SECRET_KEY=...
NCLOUD_MAIL_SENDER_ADDRESS=sender@your-domain.com
```

선택 환경변수:

```bash
NCLOUD_MAIL_SENDER_NAME=관리자 시스템
NCLOUD_MAIL_API_BASE_URL=https://mail.apigw.ntruss.com/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
