// 저장 시점에 함께 저장된 summary.monthly의 처음~마지막 항목에서 "기간"을 뽑아낸다.
// (연도만으로는 위하고 분개장이 부분 개월치만 담겨 있어도 그해 전체인 것처럼 보임)
// "2025년 01월~07월" (같은 해) 또는 "2024년 12월~2025년 02월" (해가 걸친 경우) 형태.
function parseYm(ym: unknown): { year: string; month: string } | null {
  if (typeof ym !== "string") return null;
  const m = ym.match(/(\d+)년\s*(\d+)월/);
  if (!m) return null;
  return { year: m[1], month: m[2].padStart(2, "0") };
}

export function extractPeriod(summary: unknown): string | null {
  if (!summary || typeof summary !== "object") return null;
  const monthly = (summary as { monthly?: unknown }).monthly;
  if (!Array.isArray(monthly) || monthly.length === 0) return null;

  const start = parseYm((monthly[0] as { ym?: unknown } | undefined)?.ym);
  const end = parseYm(
    (monthly[monthly.length - 1] as { ym?: unknown } | undefined)?.ym,
  );
  if (!start || !end) return null;

  if (start.year === end.year && start.month === end.month) {
    return `${start.year}년 ${start.month}월`;
  }
  if (start.year === end.year) {
    return `${start.year}년 ${start.month}월~${end.month}월`;
  }
  return `${start.year}년 ${start.month}월~${end.year}년 ${end.month}월`;
}
