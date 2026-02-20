import * as XLSX from "xlsx";
import type { ParsedRows, SalaryIncomeType } from "../types";
import { parserRegistry } from "./registry";
import type { SalaryParserVariant } from "./types";
import { readSheetRawData } from "./utils";

function selectBestVariant(
  variants: SalaryParserVariant[],
  rawData: unknown[][],
): SalaryParserVariant {
  let selected = variants[0];
  let bestScore = -1;

  for (const variant of variants) {
    let score = 0;

    try {
      score = variant.detect(rawData);
    } catch {
      score = 0;
    }

    if (score > bestScore) {
      selected = variant;
      bestScore = score;
    }
  }

  return selected;
}

export function parseWorksheetByIncomeType(
  worksheet: XLSX.WorkSheet,
  incomeType: SalaryIncomeType,
): ParsedRows {
  const rawData = readSheetRawData(worksheet);
  const variants = parserRegistry[incomeType];

  if (!variants || variants.length === 0) {
    return { columns: [], rows: [] };
  }

  const selected = selectBestVariant(variants, rawData);
  return selected.parse(rawData);
}
