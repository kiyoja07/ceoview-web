import { createHmac } from "crypto";

type SendNcloudSmsParams = {
  to: string;
  content: string;
  subject?: string;
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

export async function sendNcloudSms({
  to,
  content,
  subject,
}: SendNcloudSmsParams) {
  const { accessKey, secretKey, serviceId, senderNumber } = getSmsConfig();

  const requestPath = `/sms/v2/services/${serviceId}/messages`;
  const requestUrl = `https://sens.apigw.ntruss.com${requestPath}`;
  const timestamp = Date.now().toString();

  const signature = createSignature({
    method: "POST",
    requestPath,
    timestamp,
    accessKey,
    secretKey,
  });

  const payload = {
    type: "LMS",
    contentType: "COMM",
    countryCode: "82",
    from: senderNumber,
    subject: subject || "관리자 시스템",
    content,
    messages: [{ to }],
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
      `[NcloudSms] 문자 발송 실패 (to: ${to}, status: ${response.status})`,
      errorText,
    );
    throw new Error(
      `Ncloud sms send failed (${response.status}): ${errorText.slice(0, 500)}`,
    );
  }
}
