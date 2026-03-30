import { formatBusinessNumber as formatBusinessNumberValue, formatDateTimeDisplay } from "@/app/lib/formatters";
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

export const formatBusinessNumber = formatBusinessNumberValue;

export function formatDateTime(value: string) {
  return formatDateTimeDisplay(value);
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
