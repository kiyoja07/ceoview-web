import type { SalaryParserVariant } from "../types";
import { detectBestTwoRowHeader, parseTwoRowGroupedByMarkers } from "../utils";

const MARKER_COLS = [
  "코드",
  "성   명",
  "소득구분",
  "귀속년월",
  "지급년월",
  "지급액",
  "소득세/법인세",
  "지방소득세",
  "차인지급액",
];

export const otherIncomeTwoRowGroupedV1: SalaryParserVariant = {
  id: "other-income.two-row-grouped.v1",
  incomeType: "OTHER_INCOME",
  description: "2행 헤더 + 2행 그룹 데이터(기타소득 기본 양식)",
  detect(rawData) {
    const { matchedCount } = detectBestTwoRowHeader(rawData, MARKER_COLS);
    return Math.round((matchedCount / MARKER_COLS.length) * 100);
  },
  parse(rawData) {
    return parseTwoRowGroupedByMarkers(rawData, MARKER_COLS);
  },
};
