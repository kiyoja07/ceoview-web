import type { MessageSendResult, SmsSendInput } from "./types";
import {
  MessageSendValidationError,
  createNcloudSignature,
  getRequiredString,
  isValidKoreanMobilePhone,
  normalizePhoneNumber,
} from "./shared";

function getSmsConfig() {
  const accessKey = process.env.NCLOUD_ACCESS_KEY;
  const secretKey = process.env.NCLOUD_SECRET_KEY;
  const serviceId = process.env.NCLOUD_SMS_SERVICE_ID;
  const senderNumber = process.env.NCLOUD_SMS_SENDER_NUMBER;

  if (!accessKey || !secretKey || !serviceId || !senderNumber) {
    throw new Error(
      "Missing NCLOUD SMS env. Required: NCLOUD_ACCESS_KEY, NCLOUD_SECRET_KEY, NCLOUD_SMS_SERVICE_ID, NCLOUD_SMS_SENDER_NUMBER",
    );
  }

  return {
    accessKey,
    secretKey,
    serviceId,
    senderNumber,
  };
}

export async function sendSms(
  input: SmsSendInput,
): Promise<MessageSendResult> {
  const to = normalizePhoneNumber(getRequiredString(input.to, "수신 전화번호"));
  const content = getRequiredString(input.content, "문자 본문");
  const subject =
    typeof input.subject === "string" && input.subject.trim()
      ? input.subject.trim()
      : "관리자 시스템";

  if (!isValidKoreanMobilePhone(to)) {
    throw new MessageSendValidationError("올바른 전화번호 형식이 아닙니다.");
  }

  const { accessKey, secretKey, serviceId, senderNumber } = getSmsConfig();
  const requestPath = `/sms/v2/services/${serviceId}/messages`;
  const requestUrl = `https://sens.apigw.ntruss.com${requestPath}`;
  const timestamp = Date.now().toString();
  const signature = createNcloudSignature({
    method: "POST",
    requestPath,
    timestamp,
    accessKey,
    secretKey,
  });

  const response = await fetch(requestUrl, {
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
      subject,
      content,
      messages: [{ to }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[NcloudSms] 문자 발송 실패 (to: ${to}, status: ${response.status})`,
      errorText,
    );
    throw new Error(
      `Ncloud sms send failed (${response.status}): ${errorText.slice(0, 500)}`,
    );
  }

  return { success: true };
}
