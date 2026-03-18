import { createHmac } from "crypto";

type KakaoBizButton = {
  type: "WL";
  name: string;
  mobileUrl: string;
  pcUrl?: string;
};

type SendKakaoBizMessageParams = {
  to: string;
  title?: string;
  body: string;
  templateCode?: string;
  buttons?: KakaoBizButton[];
};

function createSignature({
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

function normalizePhoneNumber(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

function getKakaoBizMessageConfig() {
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

export async function sendKakaoBizMessage({
  to,
  body,
  templateCode,
  buttons,
}: SendKakaoBizMessageParams) {
  const config = getKakaoBizMessageConfig();
  const resolvedTemplateCode = templateCode || config.templateCode;

  if (!resolvedTemplateCode) {
    throw new Error(
      "Missing Kakao AlimTalk template code. Set KAKAO_PAYSLIP_TEMPLATE_CODE or pass templateCode.",
    );
  }

  const requestPath = `/alimtalk/v2/services/${config.serviceId}/messages`;
  const requestUrl = `https://sens.apigw.ntruss.com${requestPath}`;
  const timestamp = Date.now().toString();
  const signature = createSignature({
    method: "POST",
    requestPath,
    timestamp,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });

  const payload = {
    plusFriendId: config.plusFriendId,
    templateCode: resolvedTemplateCode,
    messages: [
      {
        to: normalizePhoneNumber(to),
        content: body,
        buttons: (buttons ?? []).map((button) => ({
          type: button.type,
          name: button.name,
          linkMobile: button.mobileUrl,
          ...(button.pcUrl ? { linkPc: button.pcUrl } : {}),
        })),
      },
    ],
  };

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": config.accessKey,
      "x-ncp-apigw-signature-v2": signature,
    },
    body: JSON.stringify(payload),
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

  return response.json().catch(() => null);
}
