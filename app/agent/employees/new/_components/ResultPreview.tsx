import type {
  EmployeeUploadResult,
  EmployeeMappedRow,
} from "@/types/agent/employee";
import { formatCell } from "../utils";

export function ResultPreview({
  result,
  saving,
  publishing,
  onSave,
  onPublish,
}: {
  result: EmployeeUploadResult;
  saving: boolean;
  publishing: boolean;
  onSave: () => void;
  onPublish: () => void;
}) {
  const visibleCols = result.columns.filter((col) => !col.startsWith("_"));
  const isPublished =
    result.published === true || result.publishStatus === "PUBLISHED";

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
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
                  : "매핑 결과 미리보기"}
            </h2>
            <p className="text-xs text-gray-500">
              {result.totalRows}명 · 시트: {result.sheetName}
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
                저장 중…
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
                발행 중…
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
          isPublished
            ? "border-green-200 bg-green-50 text-green-800"
            : result.saved
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <p className="font-semibold">
          현재 상태:{" "}
          {isPublished
            ? "PUBLISHED (회사 조회 가능)"
            : result.saved
              ? "SAVED (미발행)"
              : "미리보기"}
        </p>
        {!result.saved && (
          <p className="mt-1 text-xs text-amber-700">
            아래 데이터는 미리보기 상태입니다.{" "}
            <strong className="font-semibold text-amber-900">
              &ldquo;DB에 저장&rdquo; 후 &ldquo;발행하기&rdquo;까지 완료해야
              회사 조회 가능
            </strong>
            됩니다.
          </p>
        )}
        {result.saved && !isPublished && (
          <p className="mt-1 text-xs text-blue-700">
            {result.savedCount}명이 DB에 저장되었습니다. 발행 후 거래처 조회가
            가능합니다.
          </p>
        )}
        {isPublished && (
          <p className="mt-1 text-xs text-green-700">
            발행 완료되었습니다. 거래처에서 해당 직원 데이터를 조회할 수
            있습니다.
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            {result.matchedCount}
          </p>
          <p className="text-xs text-emerald-600">급여 매핑됨</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-700">
            {result.unmatchedCount}
          </p>
          <p className="text-xs text-amber-600">미매핑</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-700">
            {result.alreadyRegisteredCount}
          </p>
          <p className="text-xs text-blue-600">기존 등록 직원</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-600">
                급여매핑
              </th>
              {visibleCols.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-600"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {result.rows.map((row, idx) => {
              const mapped = row as EmployeeMappedRow;
              return (
                <tr
                  key={idx}
                  className={
                    mapped._alreadyRegistered
                      ? "bg-blue-50/30"
                      : mapped._hasSalaryMatch
                        ? "bg-emerald-50/30"
                        : ""
                  }
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    {mapped._hasSalaryMatch ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                        매핑
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        미매핑
                      </span>
                    )}
                    {mapped._alreadyRegistered && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                        기존
                      </span>
                    )}
                  </td>
                  {visibleCols.map((col) => (
                    <td
                      key={col}
                      className="whitespace-nowrap px-3 py-2 text-gray-700"
                    >
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
