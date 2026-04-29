import { formatBusinessNumber, formatCurrencyKRW } from "@/app/lib/formatters";

export function formatOrganizationNumber(value: string) {
  return formatBusinessNumber(value);
}

export function formatCurrency(value: number) {
  return formatCurrencyKRW(value, { style: "prefix" });
}
