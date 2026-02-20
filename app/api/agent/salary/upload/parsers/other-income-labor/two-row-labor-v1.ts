import type { ParsedRows } from "../../types";
import type { SalaryParserVariant } from "../types";
import { clean } from "../../utils";
import { detectHeaderMatchScore } from "../utils";

const MARKER_COLS = ["코드", "성명", "급여총액", "차인지급액"];

function parseOtherIncomeLaborRows(rawData: unknown[][]): ParsedRows {
  if (rawData.length < 9) {
    return { columns: [], rows: [] };
  }

  const h1 = rawData[6] as unknown[];
  const h2 = rawData[7] as unknown[];

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

  const records: Record<string, unknown>[] = [];
  for (let i = 8; i < rawData.length; i += 2) {
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
      records.push(record);
    }
  }

  return { columns, rows: records };
}

export const otherIncomeLaborTwoRowV1: SalaryParserVariant = {
  id: "other-income-labor.two-row.v1",
  incomeType: "OTHER_INCOME_LABOR",
  description: "메타 6행 이후 2행 헤더 + 2행 그룹 데이터(일용소득 기본 양식)",
  detect(rawData) {
    return detectHeaderMatchScore(rawData, 6, 7, MARKER_COLS);
  },
  parse(rawData) {
    return parseOtherIncomeLaborRows(rawData);
  },
};
