import type { ParsedRows, SalaryIncomeType } from "../types";

export type RawSheetData = unknown[][];

export type SalaryParserVariant = {
  id: string;
  incomeType: SalaryIncomeType;
  description: string;
  detect: (rawData: RawSheetData) => number;
  parse: (rawData: RawSheetData) => ParsedRows;
};
