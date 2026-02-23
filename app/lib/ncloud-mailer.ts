import { createHmac } from "crypto";

type RecipientType = "R" | "C" | "B";

type NcloudMailRecipient = {
  address: string;
  name?: string;
  type?: RecipientType;
};

type SendNcloudMailParams = {
  to: string;
  title: string;
  body: string;
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

function getMailerConfig() {
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

export async function sendNcloudMagicLinkMail({
  to,
  title,
  body,
}: SendNcloudMailParams) {
  const { accessKey, secretKey, senderAddress, senderName, apiBaseUrl } =
    getMailerConfig();

  const baseUrl = new URL(apiBaseUrl);
  const normalizedBasePath = baseUrl.pathname.replace(/\/+$/, "");
  const requestPath = `${normalizedBasePath}/mails`;
  const requestUrl = `${baseUrl.origin}${requestPath}`;
  const timestamp = Date.now().toString();

  const signature = createSignature({
    method: "POST",
    requestPath,
    timestamp,
    accessKey,
    secretKey,
  });

  const recipients: NcloudMailRecipient[] = [{ address: to, type: "R" }];
  const payload = {
    senderAddress,
    senderName,
    title,
    body,
    recipients,
    individual: true,
    advertising: false,
  };

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-signature-v2": signature,
    },
    body: JSON.stringify(payload),
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
}
