import type { ResultPreviewProps } from "../types";

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  const str = String(value);
  const num = Number(str);
  if (str !== "" && !isNaN(num) && isFinite(num) && /^-?\d+(\.\d+)?$/.test(str))
    return num.toLocaleString("ko-KR");
  return str;
}

export function ResultPreview({ result, saving, onSave }: ResultPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              result.saved
                ? "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {result.saved ? (
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
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            ) : (
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
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {result.saved ? "저장 완료" : "파싱 결과 미리보기"}
            </h2>
            <p className="text-xs text-gray-500">
              {result.incomeTypeLabel} · {result.totalRows}건 · 시트:{" "}
              {result.sheetName}
            </p>
          </div>
        </div>
        {!result.saved && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {saving ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                저장 중...
              </>
            ) : (
              "DB에 저장"
            )}
          </button>
        )}
      </div>

      {/* Saved message */}
      {result.saved && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          {result.savedCount}건이 DB에 저장되었습니다.
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  #
                </th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.rows.slice(0, 50).map((row, idx) => (
                <tr key={idx} className="transition-colors hover:bg-blue-50/40">
                  <td className="px-3 py-2 tabular-nums text-gray-300">
                    {idx + 1}
                  </td>
                  {result.columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-gray-700">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.totalRows > 50 && (
        <p className="text-center text-xs text-gray-400">
          상위 50건만 표시됩니다. (전체 {result.totalRows}건)
        </p>
      )}
    </div>
  );
}
