import type { KakaoMessageButton, KakaoSendInput, MessageSendResult } from "./types";
import {
  MessageSendValidationError,
  createNcloudSignature,
  getRequiredString,
  isValidKoreanMobilePhone,
  normalizePhoneNumber,
} from "./shared";

function getKakaoConfig() {
  const accessKey =
    process.env.NCLOUD_ACCESS_KEY || process.env.NCLOUD_KEY || "";
  const secretKey =
    process.env.NCLOUD_SECRET_KEY || process.env.NCLOUD_PRIVATE_KEY || "";
  const serviceId =
    process.env.NCLOUD_KAKAO_SERVICE_ID ||
    process.env.NCLOUD_ALIMTALK_SERVICE_ID ||
    "";
  const plusFriendId =
    process.env.KAKAO_PLUS_FRIEND_ID || process.env.NCLOUD_KAKAO_PLUS_FRIEND_ID;
  const templateCode = process.env.KAKAO_PAYSLIP_TEMPLATE_CODE || "";

  if (!accessKey || !secretKey || !serviceId || !plusFriendId) {
    throw new Error(
      "Missing Kakao AlimTalk env. Required: NCLOUD_ACCESS_KEY(or NCLOUD_KEY), NCLOUD_SECRET_KEY(or NCLOUD_PRIVATE_KEY), NCLOUD_KAKAO_SERVICE_ID, KAKAO_PLUS_FRIEND_ID",
    );
  }

  return {
    accessKey,
    secretKey,
    serviceId,
    plusFriendId,
    templateCode,
  };
}

function normalizeButtons(buttons: unknown): KakaoMessageButton[] {
  if (!buttons) return [];
  if (!Array.isArray(buttons)) {
    throw new MessageSendValidationError("카카오 버튼 형식이 올바르지 않습니다.");
  }

  return buttons.map((button, index) => {
    if (!button || typeof button !== "object") {
      throw new MessageSendValidationError(
        `카카오 버튼 ${index + 1} 형식이 올바르지 않습니다.`,
      );
    }

    const candidate = button as Partial<KakaoMessageButton>;
    const type =
      candidate.type === "WL"
        ? candidate.type
        : (() => {
            throw new MessageSendValidationError(
              `카카오 버튼 ${index + 1} type 값이 올바르지 않습니다.`,
            );
          })();

    return {
      type,
      name: getRequiredString(candidate.name, `카카오 버튼 ${index + 1} 이름`),
      mobileUrl: getRequiredString(
        candidate.mobileUrl,
        `카카오 버튼 ${index + 1} 모바일 URL`,
      ),
      ...(candidate.pcUrl
        ? {
            pcUrl: getRequiredString(
              candidate.pcUrl,
              `카카오 버튼 ${index + 1} PC URL`,
            ),
          }
        : {}),
    };
  });
}

export async function sendKakaoMessage(
  input: KakaoSendInput,
): Promise<MessageSendResult> {
  const to = normalizePhoneNumber(getRequiredString(input.to, "수신 전화번호"));
  const body = getRequiredString(input.body, "카카오톡 본문");
  const buttons = normalizeButtons(input.buttons);
  const config = getKakaoConfig();
  const templateCode =
    typeof input.templateCode === "string" && input.templateCode.trim()
      ? input.templateCode.trim()
      : config.templateCode;

  if (!isValidKoreanMobilePhone(to)) {
    throw new MessageSendValidationError("올바른 전화번호 형식이 아닙니다.");
  }

  if (!templateCode) {
    throw new Error(
      "Missing Kakao AlimTalk template code. Set KAKAO_PAYSLIP_TEMPLATE_CODE or pass templateCode.",
    );
  }

  const requestPath = `/alimtalk/v2/services/${config.serviceId}/messages`;
  const requestUrl = `https://sens.apigw.ntruss.com${requestPath}`;
  const timestamp = Date.now().toString();
  const signature = createNcloudSignature({
    method: "POST",
    requestPath,
    timestamp,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": config.accessKey,
      "x-ncp-apigw-signature-v2": signature,
    },
    body: JSON.stringify({
      plusFriendId: config.plusFriendId,
      templateCode,
      messages: [
        {
          to,
          content: body,
          buttons: buttons.map((button) => ({
            type: button.type,
            name: button.name,
            linkMobile: button.mobileUrl,
            ...(button.pcUrl ? { linkPc: button.pcUrl } : {}),
          })),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[KakaoAlimTalk] 발송 실패 (to: ${to}, status: ${response.status})`,
      errorText,
    );
    throw new Error(
      `Kakao AlimTalk send failed (${response.status}): ${errorText.slice(0, 500)}`,
    );
  }

  await response.json().catch(() => null);
  return { success: true };
}
