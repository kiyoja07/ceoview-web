import * as XLSX from "xlsx";
import type { AccountCatalogRow } from "./types";
import { clean, stripBom, toBool } from "./utils";

// 계정과목 매핑 컬럼 별칭 (CSV/엑셀 헤더 편차 대응)
const COLUMN_ALIASES: Record<keyof AccountCatalogRow, string[]> = {
  code: ["코드", "계정코드"],
  wehagoName: ["계정과목_위하고", "계정과목"],
  category: ["구분"],
  isCompanyDefined: ["회사설정과목여부"],
  standardName: ["계정과목_표준", "R계정과목", "표준계정과목"],
  usage: ["계정용도"],
  isRevenue: ["수익여부"],
  isExpense: ["비용여부"],
  hasVat: ["부가세여부"],
};

function pick(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const key of aliases) {
    if (key in row && row[key] !== undefined && row[key] !== "") return row[key];
  }
  // 부분 일치(헤더에 공백/BOM 등 잔여물이 있을 때)
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const hit = keys.find((k) => k.replace(/\uFEFF/g, "").trim() === alias);
    if (hit && row[hit] !== "") return row[hit];
  }
  return undefined;
}

function rowsFromFile(bytes: ArrayBuffer, fileName: string): Record<string, unknown>[] {
  const ext = fileName.split(".").pop()?.toLowerCase();
  let workbook: XLSX.WorkBook;

  if (ext === "csv") {
    // CSV: UTF-8(BOM) 텍스트로 디코딩 후 BOM 제거
    const text = stripBom(new TextDecoder("utf-8").decode(bytes));
    workbook = XLSX.read(text, { type: "string" });
  } else {
    workbook = XLSX.read(new Uint8Array(bytes), { type: "array" });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

/**
 * 계정과목 매핑 파일(CSV/엑셀)을 파싱한다.
 * 컬럼: 코드, 계정과목_위하고, 구분, 회사설정과목여부, 계정과목_표준, 계정용도, 수익여부, 비용여부, 부가세여부
 */
export function parseAccountCatalog(
  bytes: ArrayBuffer,
  fileName: string,
): AccountCatalogRow[] {
  const raw = rowsFromFile(bytes, fileName);
  const result: AccountCatalogRow[] = [];
  const seen = new Set<string>();

  for (const row of raw) {
    const code = clean(pick(row, COLUMN_ALIASES.code));
    if (!code || seen.has(code)) continue;
    seen.add(code);

    result.push({
      code,
      wehagoName: clean(pick(row, COLUMN_ALIASES.wehagoName)) || null,
      category: clean(pick(row, COLUMN_ALIASES.category)) || null,
      isCompanyDefined: toBool(pick(row, COLUMN_ALIASES.isCompanyDefined)),
      standardName: clean(pick(row, COLUMN_ALIASES.standardName)) || null,
      usage: clean(pick(row, COLUMN_ALIASES.usage)) || null,
      isRevenue: toBool(pick(row, COLUMN_ALIASES.isRevenue)),
      isExpense: toBool(pick(row, COLUMN_ALIASES.isExpense)),
      hasVat: toBool(pick(row, COLUMN_ALIASES.hasVat)),
    });
  }

  return result;
}
