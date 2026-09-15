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

export function ResultPreview({
  result,
  saving,
  publishing,
  onSave,
  onPublish,
}: ResultPreviewProps) {
  const isPublished =
    result.published === true || result.publishStatus === "PUBLISHED";
  const companyVisible = result.companyVisible === true || isPublished;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isPublished
                ? "bg-emerald-100 text-emerald-600"
                : result.saved
                  ? "bg-blue-100 text-blue-600"
                  : "bg-amber-100 text-amber-600"
            }`}
          >
            {isPublished ? (
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
            ) : result.saved ? (
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
                  d="M16.5 6.75h-9a2.25 2.25 0 0 0-2.25 2.25v8.25A2.25 2.25 0 0 0 7.5 19.5h9a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25ZM8.25 6V4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V6"
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
              {isPublished
                ? "발행 완료"
                : result.saved
                  ? "저장 완료 (미발행)"
                  : "데이터 추출 결과 미리보기"}
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
        {result.saved && !isPublished && (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {publishing ? (
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
                발행 중...
              </>
            ) : (
              "발행하기"
            )}
          </button>
        )}
      </div>

      {/* Publication status */}
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          companyVisible
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-blue-200 bg-blue-50 text-blue-800"
        }`}
      >
        <p className="font-semibold">
          현재 상태:{" "}
          {isPublished ? "PUBLISHED (회사 조회 가능)" : "SAVED (미발행)"}
        </p>
        {!isPublished && (
          <p className="mt-1 text-xs text-blue-700">
            아직 발행되지 않아 현재 거래처에서는 이 데이터를 조회할 수 없습니다.
          </p>
        )}
      </div>

      {/* Save reminder */}
      {!result.saved && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p>
            아래 데이터는 미리보기 상태입니다.{" "}
            <strong className="font-semibold text-amber-900">
              &ldquo;DB에 저장&rdquo; 후 &ldquo;발행하기&rdquo;까지 완료해야
              회사 조회 가능
            </strong>
            됩니다.
          </p>
        </div>
      )}

      {/* Saved (not published) message */}
      {result.saved && !isPublished && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
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
              d="M16.5 6.75h-9a2.25 2.25 0 0 0-2.25 2.25v8.25A2.25 2.25 0 0 0 7.5 19.5h9a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25ZM8.25 6V4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V6"
            />
          </svg>
          {result.savedCount}건이 DB에 저장되었습니다. 발행 후 거래처 조회가
          가능합니다.
        </div>
      )}

      {/* Published message */}
      {isPublished && (
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
          발행 완료되었습니다. 거래처에서 해당 데이터를 조회할 수 있습니다.
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
