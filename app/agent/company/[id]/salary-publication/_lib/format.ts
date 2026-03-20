import type { ActionType } from "./types";

export const YM_COLUMN_KEYS = new Set(["accrualYm", "paymentYm"]);
export const CODE_COLUMN_KEY_REGEX = /code/i;
export const NUMERIC_TEXT_REGEX = /^-?\d+(\.\d+)?$/;
export const NON_SUM_COLUMN_KEYS = new Set([
  "employeeCode",
  "employeeName",
  "incomeType",
  "jobType",
  "position",
  "payDate",
  "accrualYm",
  "paymentYm",
]);

export function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPublishStatusLabel(status: ActionType) {
  return status === "PUBLISHED" ? "공개" : "비공개";
}

function formatNumericTextWithComma(value: string) {
  const negative = value.startsWith("-");
  const absValue = negative ? value.slice(1) : value;
  const [integerPart, fractionPart] = absValue.split(".");
  const commaInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const joined =
    fractionPart !== undefined ? `${commaInt}.${fractionPart}` : commaInt;
  return negative ? `-${joined}` : joined;
}

export function formatPreviewValue(value: unknown, columnKey: string) {
  if (value === null || value === undefined || value === "") return "-";

  if (YM_COLUMN_KEYS.has(columnKey) || CODE_COLUMN_KEY_REGEX.test(columnKey)) {
    return String(value);
  }

  if (typeof value === "boolean") return value ? "Y" : "N";

  if (typeof value === "number") return value.toLocaleString("ko-KR");

  if (typeof value === "string") {
    const normalized = value.trim();
    if (NUMERIC_TEXT_REGEX.test(normalized)) {
      return formatNumericTextWithComma(normalized);
    }
    return value;
  }

  return String(value);
}

export function toNumericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!NUMERIC_TEXT_REGEX.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
