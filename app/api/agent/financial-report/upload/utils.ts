// 분개장/계정과목 파싱 공용 헬퍼

export function clean(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

// 헤더 셀 정리: 줄바꿈(\n)과 슬래시(/) 제거 (위하고 분개장 헤더가 "전표\n번호" 형태)
export function cleanHeader(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/[\n\r]/g, "")
    .replace(/\//g, "")
    .trim();
}

// "58,000" / "205,483,000" / "" → number (콤마 제거, 음수 허용)
export function toAmount(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isNaN(n) ? 0 : n;
}

// "TRUE"/"true"/"1" → true, 그 외 공란 → false
export function toBool(v: unknown): boolean {
  const s = clean(v).toUpperCase();
  return s === "TRUE" || s === "1" || s === "Y";
}

export function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}
