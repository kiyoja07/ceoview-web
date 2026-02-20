/** Move YYYYMM string by delta month. Falls back to current month when invalid. */
export function shiftYm(ym: string, delta: number): string {
  if (!ym || ym.length !== 6) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1 + delta;
    const d = new Date(y, m - 1, 1);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(4, 6)) + delta;
  const d = new Date(y, m - 1, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildPageNumbers(
  currentPage: number,
  totalPages: number,
): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}
