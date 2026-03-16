import * as XLSX from "xlsx";

export type ParsedEmployee = {
  columns: string[];
  rows: Record<string, unknown>[];
};

function clean(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && isNaN(v)) return "";
  const text = String(v).trim();
  if (text.toLowerCase().startsWith("unnamed")) return "";
  return text;
}

function cleanVal(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === "number" && isNaN(v)) return null;
  if (v === "") return null;
  return v;
}

/**
 * Parse 위하고 사원등록 엑셀 파일.
 *
 * 헤더 구조:
 *   Row 0 — 단일 헤더 행 (사원코드, 사원명, 내외국인구분 등)
 *
 * 데이터: Row 1부터 1행 = 1인
 */
export function parseEmployeeRegistration(
  worksheet: XLSX.WorkSheet,
): ParsedEmployee {
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (rawData.length < 2) {
    return { columns: [], rows: [] };
  }

  // ── 헤더: Row 0 ──
  const headerRow = (rawData[0] as unknown[]).map(clean);

  // 컬럼명 정리 (빈 컬럼명/중복 처리)
  const seen: Record<string, number> = {};
  const columns: string[] = headerRow.map((col, idx) => {
    const name = col || `col_${idx + 1}`;
    seen[name] = (seen[name] || 0) + 1;
    return seen[name] > 1 ? `${name}_${seen[name]}` : name;
  });

  // ── 데이터: Row 1부터 1행 = 1인 ──
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const dataRow = (rawData[i] as unknown[]) || [];

    const record: Record<string, unknown> = {};
    let hasData = false;
    columns.forEach((col, j) => {
      const val = cleanVal(dataRow[j]);
      record[col] = val;
      if (val != null && val !== "") hasData = true;
    });

    if (hasData) {
      rows.push(record);
    }
  }

  return { columns, rows };
}
