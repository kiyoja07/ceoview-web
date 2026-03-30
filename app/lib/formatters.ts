const numberFormatter = new Intl.NumberFormat("ko-KR");

export function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatCurrencyKRW(
  value: number,
  options: {
    style?: "suffix" | "prefix" | "plain";
  } = {},
): string {
  const formatted = numberFormatter.format(value);
  switch (options.style ?? "suffix") {
    case "prefix":
      return `₩ ${formatted}`;
    case "plain":
      return formatted;
    case "suffix":
    default:
      return `${formatted}원`;
  }
}

export function formatDateDisplay(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
  fallback = "-",
): string {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString("ko-KR", options);
}

export function formatDateTimeDisplay(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  },
  fallback = "-",
): string {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString("ko-KR", options);
}

export function formatResidentNumber(
  value: string,
  options: {
    maxDigits?: number;
  } = {},
): string {
  const digits = value.replace(/\D/g, "");
  const cleaned =
    typeof options.maxDigits === "number"
      ? digits.slice(0, options.maxDigits)
      : digits;

  if (cleaned.length <= 6) {
    return cleaned;
  }

  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
}

export function maskResidentNumber(value: string | null): string {
  if (!value) return "-";

  const cleaned = value.replace(/[^0-9*]/g, "");
  if (cleaned.length >= 7) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 7)}******`;
  }

  return value;
}

export function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
