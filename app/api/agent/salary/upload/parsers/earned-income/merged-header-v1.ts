import type { SalaryParserVariant } from "../types";
import { detectHeaderMatchScore, parseMergedHeaderRows } from "../utils";

const REQUIRED_MARKERS = ["사원코드", "사원명", "지급액계", "공제액계", "차인지급액"];

export const earnedIncomeMergedHeaderV1: SalaryParserVariant = {
  id: "earned-income.merged-header.v1",
  incomeType: "EARNED_INCOME",
  description: "기본 2행 병합 헤더(1~2행 헤더, 3행부터 데이터)",
  detect(rawData) {
    return detectHeaderMatchScore(rawData, 0, 1, REQUIRED_MARKERS);
  },
  parse(rawData) {
    return parseMergedHeaderRows(rawData, 0, 1, 2);
  },
};
