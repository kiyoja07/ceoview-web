export { formatBusinessNumber } from "@/app/lib/formatters";

export function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
}
