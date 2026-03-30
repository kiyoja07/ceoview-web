import * as XLSX from "xlsx";

export type ParsedEmployee = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type ParsedBusinessIncomeEmployee = ParsedEmployee;

export type ParsedOtherIncomeEmployee = ParsedEmployee;

export type ParsedDailyLaborEmployee = ParsedEmployee;

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

/**
 * Parse 위하고 사업소득자명부 엑셀 파일.
 *
 * 헤더 구조 (2행 병합):
 *   Row 6 — NO, 코드, 성명, 소득구분, 상호, 사업장주소, 우편번호
 *   Row 7 — (빈), 내/외국인, 주민(외국인)등록번호, 거주구분, 사업자등록번호, 소득자주소, (빈)
 *
 * 데이터: Row 8부터 2행씩 묶어 1인 1행
 */
export function parseBusinessIncomeEmployeeRegistration(
  worksheet: XLSX.WorkSheet,
): ParsedBusinessIncomeEmployee {
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (rawData.length < 9) {
    return { columns: [], rows: [] };
  }

  // ── 2행 헤더: Row 6, Row 7 ──
  const h1 = (rawData[6] as unknown[]).map((v) => cleanHeader(v));
  const h2 = (rawData[7] as unknown[]).map((v) => cleanHeader(v));

  const colRow1: (string | null)[] = h1.map((v) => v || null);
  const colRow2: (string | null)[] = h2.map((v) => v || null);

  // 컬럼 생성: 각 열에서 1행/2행 헤더를 별도 컬럼으로 매핑
  const columnNames: string[] = [];
  const columnMappings: { colIdx: number; name: string; fromRow: 1 | 2 }[] = [];

  for (let i = 0; i < colRow1.length; i++) {
    const name1 = colRow1[i];
    const name2 = i < colRow2.length ? colRow2[i] : null;

    if (name1) {
      columnNames.push(name1);
      columnMappings.push({ colIdx: i, name: name1, fromRow: 1 });
    }
    if (name2) {
      columnNames.push(name2);
      columnMappings.push({ colIdx: i, name: name2, fromRow: 2 });
    }
  }

  // 중복 컬럼명 정리
  const seen: Record<string, number> = {};
  const columns: string[] = columnNames.map((col) => {
    seen[col] = (seen[col] || 0) + 1;
    return seen[col] > 1 ? `${col}_${seen[col]}` : col;
  });

  // columnMappings의 name도 동일하게 정규화
  const seen2: Record<string, number> = {};
  for (const mapping of columnMappings) {
    seen2[mapping.name] = (seen2[mapping.name] || 0) + 1;
    if (seen2[mapping.name] > 1) {
      mapping.name = `${mapping.name}_${seen2[mapping.name]}`;
    }
  }

  // ── 데이터: Row 8부터 2행씩 묶어 1인 1행 ──
  const rows: Record<string, unknown>[] = [];

  for (let i = 8; i < rawData.length; i += 2) {
    const dataRow1 = (rawData[i] as unknown[]) || [];
    const dataRow2 =
      i + 1 < rawData.length ? (rawData[i + 1] as unknown[]) : [];

    const record: Record<string, unknown> = {};
    let hasData = false;

    for (const mapping of columnMappings) {
      const sourceRow = mapping.fromRow === 1 ? dataRow1 : dataRow2;
      const val = cleanVal(sourceRow[mapping.colIdx]);
      record[mapping.name] = val;
      if (val != null && val !== "") hasData = true;
    }

    if (hasData) {
      rows.push(record);
    }
  }

  return { columns, rows };
}

/** 헤더 전용: 공백 제거 */
function cleanHeader(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && isNaN(v)) return "";
  return String(v).trim().replace(/\s+/g, "");
}

/**
 * Parse 위하고 기타소득자명부 엑셀 파일.
 *
 * 헤더 구조 (2행 병합):
 *   Row 5 — 코드, 성명, 주민(외국인)등록번호, 사업자등록번호, 사업장주소, 우편번호
 *   Row 6 — 내/외국인, 소득구분, 거주구분, 법인/개인구분, 전화번호, (빈)
 *
 * 데이터: Row 7부터 2행씩 묶어 1인 1행
 */
export function parseOtherIncomeEmployeeRegistration(
  worksheet: XLSX.WorkSheet,
): ParsedOtherIncomeEmployee {
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (rawData.length < 8) {
    return { columns: [], rows: [] };
  }

  // ── 2행 헤더: Row 5, Row 6 ──
  const h1 = (rawData[5] as unknown[]).map((v) => cleanHeader(v));
  const h2 = (rawData[6] as unknown[]).map((v) => cleanHeader(v));

  const colRow1: (string | null)[] = h1.map((v) => v || null);
  const colRow2: (string | null)[] = h2.map((v) => v || null);

  // 컬럼 생성: 각 열에서 1행/2행 헤더를 별도 컬럼으로 매핑
  const columnNames: string[] = [];
  const columnMappings: { colIdx: number; name: string; fromRow: 1 | 2 }[] = [];

  for (let i = 0; i < colRow1.length; i++) {
    const name1 = colRow1[i];
    const name2 = i < colRow2.length ? colRow2[i] : null;

    if (name1) {
      columnNames.push(name1);
      columnMappings.push({ colIdx: i, name: name1, fromRow: 1 });
    }
    if (name2) {
      columnNames.push(name2);
      columnMappings.push({ colIdx: i, name: name2, fromRow: 2 });
    }
  }

  // 중복 컬럼명 정리
  const seen: Record<string, number> = {};
  const columns: string[] = columnNames.map((col) => {
    seen[col] = (seen[col] || 0) + 1;
    return seen[col] > 1 ? `${col}_${seen[col]}` : col;
  });

  // columnMappings의 name도 동일하게 정규화
  const seen2: Record<string, number> = {};
  for (const mapping of columnMappings) {
    seen2[mapping.name] = (seen2[mapping.name] || 0) + 1;
    if (seen2[mapping.name] > 1) {
      mapping.name = `${mapping.name}_${seen2[mapping.name]}`;
    }
  }

  // ── 데이터: Row 7부터 2행씩 묶어 1인 1행 ──
  const rows: Record<string, unknown>[] = [];

  for (let i = 7; i < rawData.length; i += 2) {
    const dataRow1 = (rawData[i] as unknown[]) || [];
    const dataRow2 =
      i + 1 < rawData.length ? (rawData[i + 1] as unknown[]) : [];

    const record: Record<string, unknown> = {};
    let hasData = false;

    for (const mapping of columnMappings) {
      const sourceRow = mapping.fromRow === 1 ? dataRow1 : dataRow2;
      const val = cleanVal(sourceRow[mapping.colIdx]);
      record[mapping.name] = val;
      if (val != null && val !== "") hasData = true;
    }

    if (hasData) {
      rows.push(record);
    }
  }

  return { columns, rows };
}

/**
 * Parse 위하고 일용직사원명부 엑셀 파일.
 *
 * 헤더 구조 (2행 병합):
 *   Row 4 — 코 드, 성 명, 부 서, 직 급, 입사일, 직 종, 급여형태, 지급방법, 연장형태, 정상급여, 주 소, 은행, 현 장
 *   Row 5 — (빈), 주민등록번호, (빈), (빈), 퇴사일, (빈), (빈), (빈), (빈), 연장급여, (빈), 계좌번호, (빈)
 *
 * 메타: Row 0 = 제목, Row 2 = 회사명/범위
 * 데이터: Row 6부터 2행씩 묶어 1인 1행
 */
export function parseDailyLaborEmployeeRegistration(
  worksheet: XLSX.WorkSheet,
): ParsedDailyLaborEmployee {
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (rawData.length < 7) {
    return { columns: [], rows: [] };
  }

  // ── 2행 헤더: Row 4, Row 5 ──
  const h1 = (rawData[4] as unknown[]).map((v) => cleanHeader(v));
  const h2 = (rawData[5] as unknown[]).map((v) => cleanHeader(v));

  const colRow1: (string | null)[] = h1.map((v) => v || null);
  const colRow2: (string | null)[] = h2.map((v) => v || null);

  const columnNames: string[] = [];
  const columnMappings: { colIdx: number; name: string; fromRow: 1 | 2 }[] = [];

  for (let i = 0; i < colRow1.length; i++) {
    const name1 = colRow1[i];
    const name2 = i < colRow2.length ? colRow2[i] : null;

    if (name1) {
      columnNames.push(name1);
      columnMappings.push({ colIdx: i, name: name1, fromRow: 1 });
    }
    if (name2) {
      columnNames.push(name2);
      columnMappings.push({ colIdx: i, name: name2, fromRow: 2 });
    }
  }

  const seen: Record<string, number> = {};
  const columns: string[] = columnNames.map((col) => {
    seen[col] = (seen[col] || 0) + 1;
    return seen[col] > 1 ? `${col}_${seen[col]}` : col;
  });

  const seen2: Record<string, number> = {};
  for (const mapping of columnMappings) {
    seen2[mapping.name] = (seen2[mapping.name] || 0) + 1;
    if (seen2[mapping.name] > 1) {
      mapping.name = `${mapping.name}_${seen2[mapping.name]}`;
    }
  }

  // ── 데이터: Row 6부터 2행씩 묶어 1인 1행 ──
  const rows: Record<string, unknown>[] = [];

  for (let i = 6; i < rawData.length; i += 2) {
    const dataRow1 = (rawData[i] as unknown[]) || [];
    const dataRow2 =
      i + 1 < rawData.length ? (rawData[i + 1] as unknown[]) : [];

    const record: Record<string, unknown> = {};
    let hasData = false;

    for (const mapping of columnMappings) {
      const sourceRow = mapping.fromRow === 1 ? dataRow1 : dataRow2;
      const val = cleanVal(sourceRow[mapping.colIdx]);
      record[mapping.name] = val;
      if (val != null && val !== "") hasData = true;
    }

    if (hasData) {
      rows.push(record);
    }
  }

  return { columns, rows };
}
