# 전화번호 인증(SMS OTP) 구현 가이드

이 문서는 ceoview 프로젝트에서 사용 중인 **전화번호 본인인증(SMS OTP)** 방식을
다른 프로젝트에 동일하게 구현하기 위한 가이드입니다. 이메일 인증은 다루지 않습니다.

## 1. 개요

- 6자리 숫자 인증코드를 SMS로 발송하고, 사용자가 입력한 코드를 검증하는 방식
- 한국 휴대폰 번호(`01[016789]XXXXXXX(X)`)만 허용
- SMS 발송: **NHN Cloud (NCP/SENS) SMS API** 사용
- 인증 단계와 "인증된 결과를 실제 회원 정보에 반영하는 단계"를 분리
  (`verificationId`를 발급하고, 이후 프로필 업데이트 API에 그 ID를 같이 전달해서 검증)

흐름 한눈에 보기:

```
[클라이언트]                         [서버]
phone 입력
  └─ POST /phone-verify/send  ───▶  인증코드 생성 + DB 저장 + SMS 발송
                                     ◀── { verificationId, expiresAt }
인증코드 입력
  └─ POST /phone-verify/confirm ──▶ DB 조회 + 만료/횟수/일치 검증 + verifiedAt 기록
                                     ◀── { verified: true, phone }
(인증 완료 후) 프로필 저장
  └─ PATCH /profile  ─────────────▶ verificationId로 "진짜 인증됐는지" 재검증 후 phone 갱신
```

## 2. 의존 패키지

- 추가 외부 패키지 불필요. Node.js 내장 `crypto`(HMAC 서명용)와 `fetch`만 사용합니다.
- ORM은 예시에서 Prisma를 사용하지만, 핵심 로직은 ORM에 종속되지 않습니다.

## 3. 환경변수

NCloud(SENS) SMS 콘솔에서 발급받은 값을 설정합니다.

```env
NCLOUD_ACCESS_KEY=         # NHN Cloud API 액세스 키
NCLOUD_SECRET_KEY=         # NHN Cloud API 시크릿 키
NCLOUD_SMS_SERVICE_ID=     # SENS SMS 서비스 ID
NCLOUD_SMS_SENDER_NUMBER=  # 사전 등록된 발신 전화번호 (예: 0212345678)
```

> 다른 SMS 벤더(Twilio, 알리고, 솔라피 등)를 쓴다면 4번 섹션의 `sendSms` 함수만
> 해당 벤더 API 호출로 교체하면 되고, 나머지 인증 로직은 그대로 재사용 가능합니다.

## 4. SMS 발송 모듈

### 4.1 공통 유틸 (`lib/messages/shared.ts`)

```typescript
import { createHmac } from "crypto";

export function normalizePhoneNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isValidKoreanMobilePhone(phone: string) {
  return /^01[016789]\d{7,8}$/.test(normalizePhoneNumber(phone));
}

export function createNcloudSignature({
  method,
  requestPath,
  timestamp,
  accessKey,
  secretKey,
}: {
  method: string;
  requestPath: string;
  timestamp: string;
  accessKey: string;
  secretKey: string;
}) {
  const message = `${method} ${requestPath}\n${timestamp}\n${accessKey}`;
  return createHmac("sha256", secretKey).update(message).digest("base64");
}
```

### 4.2 SMS 발송 (`lib/messages/sms.ts`)

```typescript
import {
  createNcloudSignature,
  isValidKoreanMobilePhone,
  normalizePhoneNumber,
} from "./shared";

function getSmsConfig() {
  const accessKey = process.env.NCLOUD_ACCESS_KEY;
  const secretKey = process.env.NCLOUD_SECRET_KEY;
  const serviceId = process.env.NCLOUD_SMS_SERVICE_ID;
  const senderNumber = process.env.NCLOUD_SMS_SENDER_NUMBER;

  if (!accessKey || !secretKey || !serviceId || !senderNumber) {
    throw new Error("Missing NCLOUD SMS env vars");
  }
  return { accessKey, secretKey, serviceId, senderNumber };
}

export async function sendSms({
  to,
  content,
  subject,
}: {
  to: string;
  content: string;
  subject?: string;
}) {
  const phone = normalizePhoneNumber(to);
  if (!isValidKoreanMobilePhone(phone)) {
    throw new Error("올바른 전화번호 형식이 아닙니다.");
  }

  const { accessKey, secretKey, serviceId, senderNumber } = getSmsConfig();
  const requestPath = `/sms/v2/services/${serviceId}/messages`;
  const timestamp = Date.now().toString();
  const signature = createNcloudSignature({
    method: "POST",
    requestPath,
    timestamp,
    accessKey,
    secretKey,
  });

  const response = await fetch(`https://sens.apigw.ntruss.com${requestPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-signature-v2": signature,
    },
    body: JSON.stringify({
      type: "LMS",
      contentType: "COMM",
      countryCode: "82",
      from: senderNumber,
      subject: subject ?? "관리자 시스템",
      content,
      messages: [{ to: phone }],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ncloud sms send failed (${response.status}): ${await response.text()}`,
    );
  }
}
```

## 5. DB 스키마

인증 시도를 매 발송마다 새 레코드로 남기는 구조입니다 (재발송 쿨다운·시도횟수 제한을 위해 이력이 필요).

```prisma
model PhoneVerificationCode {
  id         String    @id @default(auto()) @map("_id") @db.ObjectId
  userId     String    @db.ObjectId
  phone      String                       // 정규화된 숫자만 (하이픈 제거)
  code       String                       // 6자리 인증코드
  expiresAt  DateTime  @map("expires_at") // 발송 시각 + TTL
  verifiedAt DateTime? @map("verified_at")// 인증 성공 시각 (성공 전엔 null)
  createdAt  DateTime  @default(now())

  @@index([userId, phone, expiresAt])
  @@index([expiresAt])
  @@map("phone_verification_code")
}
```

> 관계형 DB(Postgres/MySQL)라면 `id`는 auto-increment 또는 uuid로 바꾸면 됩니다.
> 만료된 레코드는 주기적 배치(cron)로 정리하거나, Mongo라면 `expiresAt` 기준 TTL 인덱스를 고려하세요.

## 6. 인증 핵심 로직 (`lib/phone-verification.ts`)

상수값(원본 프로젝트 기준):

```typescript
export const PHONE_VERIFICATION_CODE_TTL_MINUTES = 3; // 인증코드 만료: 3분
export const PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60; // 재발송 최소 간격: 60초
export const PHONE_VERIFICATION_MAX_ATTEMPTS = 5; // 10분 내 5회 초과 시 차단
```

전화번호 검증 / 정규화:

```typescript
export function normalizePhoneVerificationPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isValidVerificationPhone(phone: string) {
  return /^01[016789]\d{7,8}$/.test(normalizePhoneVerificationPhone(phone));
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6자리, 앞자리 0 가능
}
```

### 6.1 발송: `sendPhoneVerificationCode(owner, phone)`

처리 순서:

1. 전화번호 정규화 + 형식 검증 → 실패 시 `400`
2. 같은 사용자 + 같은 번호로 최근 60초 내 발송 기록이 있으면 → `429` (쿨다운)
3. 6자리 코드 생성, `expiresAt = now + 3분`으로 레코드 생성
4. SMS 발송: `[인증번호] 123456\n본인 확인 인증번호입니다. 3분 이내에 입력해주세요.`
5. `{ verificationId, expiresAt }` 반환 — **클라이언트는 이 `verificationId`를 들고 있어야 함**

### 6.2 확인: `confirmPhoneVerificationCode(owner, verificationId, code)`

처리 순서 (순서가 중요합니다):

1. `verificationId`로 레코드 조회, 없거나 소유자(`userId`) 불일치 → `400`
2. 이미 `verifiedAt`이 있으면(중복 확인 요청) → 그냥 성공 응답 반환
3. `expiresAt < now` → `400` "인증번호가 만료되었습니다"
4. 같은 사용자+번호로 10분 내 생성된 레코드 수가 5개 **초과**면 → `429` (무차별 대입 방지)
5. `code` 불일치 → `400` "인증번호가 일치하지 않습니다"
6. 위를 모두 통과하면 `verifiedAt = now`로 업데이트, `{ verified: true, phone }` 반환

> 주의: 4번의 시도횟수 제한은 "검증 시도 횟수"가 아니라 "발송 레코드 개수"를 카운트합니다.
> 즉 재전송 자체도 횟수에 포함되므로, 재전송 쿨다운(60초)과 합쳐 10분에 최대 약 10회 발송이 한계입니다.
> 더 엄격한 brute-force 방지가 필요하면 코드 검증 실패 횟수를 별도 필드로 카운트하는 방식을 권장합니다.

### 6.3 회원정보 반영 시 재검증: `assertVerifiedPhoneChange(owner, phone, verificationId)`

전화번호를 실제로 프로필에 저장하는 시점에, "이 전화번호가 정말 인증을 통과했는지"를
다시 한 번 서버에서 확인합니다. 클라이언트가 `verified` 플래그만 임의로 보내는 것을
막기 위한 방어 로직입니다.

```typescript
export async function assertVerifiedPhoneChange(owner, phone, verificationId) {
  const normalizedPhone = normalizePhoneVerificationPhone(phone);
  if (!normalizedPhone) return; // 전화번호를 지우는 경우는 통과

  if (!verificationId) {
    throw new PhoneVerificationError("휴대폰 인증이 필요합니다.", 400);
  }

  const record = await findVerificationRecord(owner, verificationId);

  if (
    !record ||
    !hasOwnerAccess(owner, record) ||
    record.phone !== normalizedPhone || // 인증한 번호와 저장하려는 번호가 같아야 함
    !record.verifiedAt // 실제로 인증 완료된 레코드여야 함
  ) {
    throw new PhoneVerificationError("휴대폰 인증을 완료해주세요.", 400);
  }
}
```

프로필 업데이트 API에서는 `phone`이 변경될 때만 이 함수를 호출하면 됩니다.

## 7. API 라우트

도메인(사용자 타입)별로 동일한 패턴을 반복합니다. 예시는 Next.js Route Handler 기준입니다.

### 7.1 발송 — `POST /api/auth/phone-verify/send`

```typescript
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request); // 인증 미들웨어/세션에서 추출
    if (!userId)
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );

    const { phone } = await request.json();
    const result = await sendPhoneVerificationCode(
      { userId },
      phone?.trim() ?? "",
    );

    return NextResponse.json({ success: true, ...result }); // { verificationId, expiresAt }
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "인증번호 발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
```

### 7.2 확인 — `POST /api/auth/phone-verify/confirm`

```typescript
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId)
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );

    const { verificationId, code } = await request.json();
    if (!verificationId?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "인증번호를 입력해주세요." },
        { status: 400 },
      );
    }

    const result = await confirmPhoneVerificationCode(
      { userId },
      verificationId.trim(),
      code.trim(),
    );
    return NextResponse.json({ success: true, ...result }); // { verified, phone }
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "인증 확인에 실패했습니다." },
      { status: 500 },
    );
  }
}
```

`PhoneVerificationError`는 `{ message, status }`를 갖는 커스텀 에러로, 위처럼
컨트롤러에서 그대로 status code로 변환해 응답하면 비즈니스 로직과 HTTP 레이어를
깔끔히 분리할 수 있습니다.

## 8. 프론트엔드 (React Hook)

`usePhoneVerification` 훅으로 상태를 캡슐화합니다. 상태값: `idle → sending → sent → verifying → verified`.

```typescript
type UsePhoneVerificationOptions = {
  phone: string; // 입력 중인 전화번호
  originalPhone: string; // 기존(저장된) 전화번호 — 변경 여부 판단용
  sendEndpoint: string;
  confirmEndpoint: string;
};
```

핵심 동작:

- `phone`이 `originalPhone`과 달라지고 비어있지 않으면 `needsVerification = true` → UI에서 인증 버튼 노출
- `sendCode()`: 자릿수(10자리 미만) 1차 검증 후 발송 API 호출, 성공 시 `verificationId` 저장 + 카운트다운 180초 시작
- `confirmCode()`: `verificationId` + 입력 코드로 확인 API 호출, 성공 시 `verifyState = "verified"`
- `resetVerification()`: 전화번호를 다시 수정하면 호출해서 인증 상태 초기화

```typescript
const {
  verifyState,
  verificationId,
  verifyCode,
  verifyMessage,
  countdown,
  needsVerification,
  isPhoneVerified,
  setVerifyCode,
  resetVerification,
  sendCode,
  confirmCode,
} = usePhoneVerification({
  phone,
  originalPhone,
  sendEndpoint,
  confirmEndpoint,
});
```

카운트다운 표시:

```typescript
export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}:${remainSeconds.toString().padStart(2, "0")}`;
}
```

> 주의: 훅 내부 카운트다운은 `180`초(3분 표시용 UX)로 시작하지만, 서버의 실제 만료는
> `PHONE_VERIFICATION_CODE_TTL_MINUTES`(3분)로 별도 관리됩니다. 두 값을 반드시 일치시키세요.

### 프로필 저장 시 연동

전화번호를 실제로 저장하는 화면에서는, 인증이 완료된 경우에만 `verificationId`를
프로필 업데이트 요청에 함께 보냅니다.

```typescript
await fetch("/api/profile", {
  method: "PATCH",
  body: JSON.stringify({
    phone: digits,
    phoneVerificationId: isPhoneVerified ? verificationId : undefined,
  }),
});
```

서버의 프로필 업데이트 핸들러는 `phone`이 바뀌는 경우에만
`assertVerifiedPhoneChange(owner, phone, phoneVerificationId)`를 호출해 검증합니다.

## 9. 에러 케이스 정리

| 상황                                | status | 메시지                                                    |
| ----------------------------------- | ------ | --------------------------------------------------------- |
| 전화번호 형식 오류                  | 400    | 올바른 휴대폰 번호를 입력해주세요.                        |
| 재발송 쿨다운(60초) 중              | 429    | 잠시 후 다시 시도해주세요.                                |
| 인증코드 만료(3분 경과)             | 400    | 인증번호가 만료되었습니다. 다시 요청해주세요.             |
| 10분 내 시도(발송) 5회 초과         | 429    | 인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요. |
| 인증코드 불일치                     | 400    | 인증번호가 일치하지 않습니다.                             |
| 인증 미완료 상태로 프로필 저장 시도 | 400    | 휴대폰 인증을 완료해주세요.                               |
| 미인증 사용자의 요청                | 401    | 인증이 필요합니다.                                        |

## 10. 구현 체크리스트

- [ ] NHN Cloud(또는 대체 SMS 벤더) 계정 발급 및 발신번호 사전 등록
- [ ] 환경변수 4종 설정
- [ ] `PhoneVerificationCode` 테이블/모델 생성
- [ ] `sendSms`, `phone-verification.ts` 포팅 (도메인에 맞게 `owner` 타입 단순화 가능)
- [ ] 발송/확인 API 라우트 2개 추가, 인증 미들웨어 연결
- [ ] 프로필 저장(또는 회원가입) 핸들러에 `assertVerifiedPhoneChange` 연결
- [ ] 프론트엔드 `usePhoneVerification` 훅 + 입력 UI(전화번호 input, 인증코드 input, 카운트다운, 재발송 버튼)
- [ ] 운영 환경에서 실제 SMS 발신 테스트(과금 발생 주의)
- [ ] 만료된 인증 레코드 정리 정책 결정(배치/TTL 인덱스)

## 11. 보안/운영 참고사항

- 전화번호는 개인정보이므로 저장/로그 시 개인정보보호법(PIPA) 준수 필요
- 현재 코드 비교는 단순 문자열 비교(`record.code !== trimmedCode`)이며 6자리 숫자
  특성상 타이밍 공격 실효성은 낮지만, 더 엄격하게 하려면 `crypto.timingSafeEqual` 사용 고려
- SMS 발송은 실비용이 발생하므로 쿨다운/횟수 제한을 절대 제거하지 말 것
- `verificationId`는 추측 불가능한 ID(ObjectId/UUID)를 사용해야 하며, 순차 정수 PK는 피할 것
