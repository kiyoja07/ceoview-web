import * as XLSX from "xlsx";
import type { ParsedRows } from "../types";
import type { RawSheetData } from "./types";
import { clean } from "../utils";

export function readSheetRawData(worksheet: XLSX.WorkSheet): RawSheetData {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });
}

export function buildMergedColumns(
  h1: unknown[] = [],
  h2: unknown[] = [],
): string[] {
  const columns: string[] = [];
  const seen: Record<string, number> = {};

  for (let i = 0; i < Math.max(h1.length, h2.length); i++) {
    const a = clean(h1[i]);
    const b = clean(h2[i]);

    let col: string;
    if (a && b && a !== b) {
      col = `${a}_${b}`;
    } else if (b) {
      col = b;
    } else if (a) {
      col = a;
    } else {
      col = `col_${i + 1}`;
    }

    seen[col] = (seen[col] || 0) + 1;
    if (seen[col] > 1) {
      col = `${col}_${seen[col]}`;
    }

    columns.push(col);
  }

  return columns;
}

export function parseMergedHeaderRows(
  rawData: RawSheetData,
  headerRow1 = 0,
  headerRow2 = 1,
  dataStart = 2,
): ParsedRows {
  if (rawData.length <= headerRow2) {
    return { columns: [], rows: [] };
  }

  const h1 = rawData[headerRow1] as unknown[];
  const h2 = rawData[headerRow2] as unknown[];
  const columns = buildMergedColumns(h1, h2);

  const rows: Record<string, unknown>[] = [];
  for (let r = dataStart; r < rawData.length; r++) {
    const rowData = rawData[r] as unknown[];
    const obj: Record<string, unknown> = {};
    let hasData = false;

    columns.forEach((col, i) => {
      const val = rowData[i] ?? "";
      obj[col] = val;
      if (val !== "" && val != null) hasData = true;
    });

    if (hasData) {
      rows.push(obj);
    }
  }

  return { columns, rows };
}

export function detectHeaderMatchScore(
  rawData: RawSheetData,
  rowIndex1: number,
  rowIndex2: number,
  markerCols: string[],
): number {
  if (rawData.length <= rowIndex2 || markerCols.length === 0) {
    return 0;
  }

  const row1Values = (rawData[rowIndex1] as unknown[]).map((v) => clean(v));
  const row2Values = (rawData[rowIndex2] as unknown[]).map((v) => clean(v));
  const combined = new Set([...row1Values, ...row2Values]);
  const matched = markerCols.filter((k) => combined.has(k)).length;

  return Math.round((matched / markerCols.length) * 100);
}

export function detectBestTwoRowHeader(
  rawData: RawSheetData,
  markerCols: string[],
  scanLimit = 12,
): { headerStart: number; matchedCount: number } {
  let headerStart = -1;
  let matchedCount = 0;

  for (let i = 0; i < Math.min(rawData.length - 1, scanLimit); i++) {
    const score = detectHeaderMatchScore(rawData, i, i + 1, markerCols);
    const count = Math.round((score / 100) * markerCols.length);

    if (count > matchedCount) {
      matchedCount = count;
      headerStart = i;
    }
  }

  return { headerStart, matchedCount };
}

export function parseTwoRowGroupedByMarkers(
  rawData: RawSheetData,
  markerCols: string[],
): ParsedRows {
  if (rawData.length < 3) {
    return { columns: [], rows: [] };
  }

  const { headerStart, matchedCount } = detectBestTwoRowHeader(rawData, markerCols);
  if (headerStart === -1 || matchedCount < Math.ceil(markerCols.length / 3)) {
    return { columns: [], rows: [] };
  }

  const h1 = rawData[headerStart] as unknown[];
  const h2 = rawData[headerStart + 1] as unknown[];

  const colRow1: (string | null)[] = [];
  const colRow2: (string | null)[] = [];

  for (let i = 0; i < Math.max(h1.length, h2.length); i++) {
    const a = clean(h1[i]);
    const b = clean(h2[i]);
    colRow1.push(a || null);
    colRow2.push(b || null);
  }

  const allCols = new Set<string>();
  for (let i = 0; i < colRow1.length; i++) {
    if (colRow1[i]) allCols.add(colRow1[i]!);
    if (colRow2[i]) allCols.add(colRow2[i]!);
  }
  const columns = Array.from(allCols);

  const dataStart = headerStart + 2;
  const rows: Record<string, unknown>[] = [];

  for (let i = dataStart; i < rawData.length; i += 2) {
    const row1 = rawData[i] as unknown[];
    const row2 = i + 1 < rawData.length ? (rawData[i + 1] as unknown[]) : [];

    const record: Record<string, unknown> = {};
    let hasData = false;

    for (let ci = 0; ci < colRow1.length; ci++) {
      const name1 = colRow1[ci];
      const name2 = colRow2[ci];
      const val1 = row1[ci] ?? null;
      const val2 = row2[ci] ?? null;

      if (name1 && name2) {
        record[name1] = val1 === "" ? null : val1;
        record[name2] = val2 === "" ? null : val2;
        if (val1 !== "" && val1 != null) hasData = true;
        if (val2 !== "" && val2 != null) hasData = true;
      } else if (name1) {
        record[name1] = val1 === "" ? null : val1;
        if (val1 !== "" && val1 != null) hasData = true;
      } else if (name2) {
        record[name2] = val2 === "" ? null : val2;
        if (val2 !== "" && val2 != null) hasData = true;
      }
    }

    if (hasData) {
      rows.push(record);
    }
  }

  return { columns, rows };
}
