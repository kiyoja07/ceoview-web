export const PAYSLIP_SEND_CHANNELS = ["EMAIL", "SMS", "KAKAO"] as const;

export type PayslipSendChannel = (typeof PAYSLIP_SEND_CHANNELS)[number];

export const DEFAULT_PAYSLIP_SEND_CHANNELS: PayslipSendChannel[] = [
  "EMAIL",
  "SMS",
];

export function isPayslipSendChannel(
  value: unknown,
): value is PayslipSendChannel {
  return (
    typeof value === "string" &&
    (PAYSLIP_SEND_CHANNELS as readonly string[]).includes(value)
  );
}

export function getPayslipChannelLabel(channel: PayslipSendChannel): string {
  switch (channel) {
    case "EMAIL":
      return "이메일";
    case "SMS":
      return "문자";
    case "KAKAO":
      return "카카오톡";
  }
}

export function getAvailablePayslipChannels({
  email,
  phone,
}: {
  email?: string | null;
  phone?: string | null;
}): PayslipSendChannel[] {
  const channels: PayslipSendChannel[] = [];
  if (email) channels.push("EMAIL");
  if (phone) {
    channels.push("SMS");
    channels.push("KAKAO");
  }
  return channels;
}

export function filterPayslipChannelsForRecipient(
  requestedChannels: PayslipSendChannel[],
  contact: { email?: string | null; phone?: string | null },
): PayslipSendChannel[] {
  const availableChannels = new Set(getAvailablePayslipChannels(contact));
  return requestedChannels.filter((channel) => availableChannels.has(channel));
}

export function sanitizeRequestedPayslipChannels(
  channels: unknown,
): PayslipSendChannel[] {
  if (!Array.isArray(channels) || channels.length === 0) {
    return [...DEFAULT_PAYSLIP_SEND_CHANNELS];
  }

  const uniqueChannels = new Set<PayslipSendChannel>();
  for (const channel of channels) {
    if (isPayslipSendChannel(channel)) {
      uniqueChannels.add(channel);
    }
  }

  return uniqueChannels.size > 0
    ? Array.from(uniqueChannels)
    : [...DEFAULT_PAYSLIP_SEND_CHANNELS];
}

export function canUsePayslipChannel(
  channel: PayslipSendChannel,
  contact: { email?: string | null; phone?: string | null },
): boolean {
  if (channel === "EMAIL") return !!contact.email;
  return !!contact.phone;
}
