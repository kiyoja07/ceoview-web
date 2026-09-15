export { formatBusinessNumber } from "@/app/lib/formatters";

export function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  return String(value);
}
