import type { EmailSendInput, MessageSendResult } from "./types";
import {
  MessageSendValidationError,
  createNcloudSignature,
  getRequiredString,
  isValidEmailAddress,
} from "./shared";

function getEmailConfig() {
  const accessKey = process.env.NCLOUD_ACCESS_KEY;
  const secretKey = process.env.NCLOUD_SECRET_KEY;
  const senderAddress = process.env.NCLOUD_MAIL_SENDER_ADDRESS;
  const senderName = process.env.NCLOUD_MAIL_SENDER_NAME;
  const apiBaseUrl =
    process.env.NCLOUD_MAIL_API_BASE_URL ||
    "https://mail.apigw.ntruss.com/api/v1";

  if (!accessKey || !secretKey || !senderAddress) {
    throw new Error(
      "Missing NCLOUD mail env. Required: NCLOUD_ACCESS_KEY, NCLOUD_SECRET_KEY, NCLOUD_MAIL_SENDER_ADDRESS",
    );
  }

  return {
    accessKey,
    secretKey,
    senderAddress,
    senderName,
    apiBaseUrl,
  };
}

export async function sendEmail(
  input: EmailSendInput,
): Promise<MessageSendResult> {
  const to = getRequiredString(input.to, "수신 이메일");
  const title = getRequiredString(input.title, "메일 제목");
  const body = getRequiredString(input.body, "메일 본문");

  if (!isValidEmailAddress(to)) {
    throw new MessageSendValidationError("올바른 이메일 형식이 아닙니다.");
  }

  const { accessKey, secretKey, senderAddress, senderName, apiBaseUrl } =
    getEmailConfig();
  const baseUrl = new URL(apiBaseUrl);
  const normalizedBasePath = baseUrl.pathname.replace(/\/+$/, "");
  const requestPath = `${normalizedBasePath}/mails`;
  const requestUrl = `${baseUrl.origin}${requestPath}`;
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
      senderAddress,
      senderName,
      title,
      body,
      recipients: [{ address: to, type: "R" }],
      individual: true,
      advertising: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[NcloudMail] 메일 발송 실패 (to: ${to}, status: ${response.status})`,
      errorText,
    );
    throw new Error(
      `Ncloud mail send failed (${response.status}): ${errorText.slice(0, 500)}`,
    );
  }

  return { success: true };
}
