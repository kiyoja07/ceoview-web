/** 202601 -> 2026-01 */
export function formatYm(ym: number): string {
  const s = String(ym);
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Numeric-ish string/number -> locale formatted number */
export function formatNumber(v: string | number): string {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("ko-KR");
}

/** 4780590609 -> 478-59-00609 */
export function formatBusinessNumber(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 10) return v;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}
