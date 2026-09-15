# API 개발

- `app/api/**/route.ts`에 Route Handler로 구현하고 `NextResponse.json()`을 사용한다.
- 기존 인증 헬퍼(회사·에이전트·직원)를 사용하고, 회사/조직 소속까지 확인한다.
- 입력은 검증·정규화한다. 회사 데이터는 `companyId`, 소프트 삭제 데이터는 `deletedAt: null` 조건을 포함한다.
- Prisma는 `@/app/lib/prisma`만 사용한다. 다중 변경은 트랜잭션으로 묶는다.
- `id`와 날짜는 JSON 안전하게 직렬화하고, 기존 `types/` 응답 계약을 유지한다.
- `400/401/403/404/409/500`을 상황에 맞게 반환한다. 서버에는 오류를 기록하고 클라이언트에는 안전한 한국어 메시지를 준다.
- 성공·인증·권한·입력 오류를 확인하고 `npm run typecheck` 또는 `npm run lint`를 실행한다.
