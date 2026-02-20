export function clean(v: unknown): string {
  if (v == null) return "";
  const text = String(v).trim();
  if (text.toLowerCase().startsWith("unnamed")) return "";
  return text;
}

export function toDecimal(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function toYearMonth(v: unknown): number {
  if (v == null || v === "") return 0;
  const s = String(v).replace(/[.\-\/\s]/g, "");
  // 8자리 이상(YYYYMMDD)이면 앞 6자리(YYYYMM)만 취한다
  const trimmed = s.length >= 8 ? s.slice(0, 6) : s;
  const n = Number.parseInt(trimmed, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function toStringOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

export function findInRow(
  row: Record<string, unknown>,
  ...names: string[]
): unknown {
  for (const name of names) {
    if (name in row && row[name] !== undefined) return row[name];
  }

  const keys = Object.keys(row);
  for (const name of names) {
    const found = keys.find((k) => k.includes(name) || name.includes(k));
    if (found && row[found] !== undefined) return row[found];
  }

  return undefined;
}

export function toDateOrNull(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toIntOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

export function toDecimalOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
