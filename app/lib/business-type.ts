/**
 * 사업자번호에서 사업자 구분(개인/법인)을 자동으로 판별합니다.
 *
 * 사업자번호 10자리 중 4~5번째 자리(중간 2자리)가 80~89이면 "CORPORATION"(법인),
 * 그 외에는 "INDIVIDUAL"(개인)으로 판별합니다.
 *
 * @param businessNumber 하이픈 포함/미포함 사업자번호 문자열
 * @returns "INDIVIDUAL" | "CORPORATION"
 */
export function deriveBusinessType(
  businessNumber: string,
): "INDIVIDUAL" | "CORPORATION" {
  const digits = businessNumber.replace(/\D/g, "");
  if (digits.length < 5) return "INDIVIDUAL";
  const mid = Number(digits.slice(3, 5));
  return mid >= 80 && mid <= 89 ? "CORPORATION" : "INDIVIDUAL";
}
