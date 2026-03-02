type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getVisiblePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

const btnBase =
  "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-sm font-medium transition-colors";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="페이지 넘기기"
      className="mt-6 flex items-center justify-center gap-1"
    >
      {/* 이전 */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${btnBase} px-2 ${
          currentPage <= 1
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      {/* 페이지 번호 */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-gray-400"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`${btnBase} ${
              page === currentPage
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ),
      )}

      {/* 다음 */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${btnBase} px-2 ${
          currentPage >= totalPages
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </nav>
  );
}
