import type {
  EmployeeUploadResult,
  EmployeeMappedRow,
} from "@/types/agent/employee";
import { formatCell } from "../utils";

export function ResultPreview({
  result,
  saving,
  onSave,
}: {
  result: EmployeeUploadResult;
  saving: boolean;
  onSave: () => void;
}) {
  const visibleCols = result.columns.filter((col) => !col.startsWith("_"));

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
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
              {result.saved ? "직원 저장 완료" : "매핑 결과 미리보기"}
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
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {saving ? (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 animate-spin"
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
              </span>
            ) : (
              "직원 저장하기"
            )}
          </button>
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
