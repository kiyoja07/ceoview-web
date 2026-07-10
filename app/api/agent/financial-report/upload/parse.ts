import * as XLSX from "xlsx";
import type { AccountCatalogRow, ParsedFinancialReport } from "./types";
import { parseJournalSheet } from "./journal-parser";
import { buildCatalogMap, pairAndSummarize } from "./pairing";

/**
 * 위하고 분개장 파일(bytes)과 계정과목 매핑을 받아
 * 차변/대변을 짝지은 재무 리포트를 생성한다.
 */
export function parseFinancialReport(
  journalBytes: ArrayBuffer,
  catalogRows: AccountCatalogRow[],
): ParsedFinancialReport {
  const workbook = XLSX.read(new Uint8Array(journalBytes), {
    type: "array",
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다.");
  }

  const { fiscalYear, lines } = parseJournalSheet(workbook.Sheets[sheetName]);
  if (lines.length === 0) {
    throw new Error("분개장에서 거래 라인을 찾을 수 없습니다.");
  }

  const catalog = buildCatalogMap(catalogRows);
  return pairAndSummarize(lines, fiscalYear, catalog);
}
