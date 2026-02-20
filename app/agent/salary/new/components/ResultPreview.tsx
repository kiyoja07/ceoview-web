import type { ParsedResult } from "../types";

type Props = {
  result: ParsedResult;
  saving: boolean;
  onSave: () => void;
};

export function ResultPreview({ result, saving, onSave }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {result.saved ? "저장 완료" : "파싱 결과 미리보기"}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({result.incomeTypeLabel} · {result.totalRows}건 · 시트: {result.sheetName})
          </span>
        </h2>
        {!result.saved && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-5 py-2 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "DB에 저장"}
          </button>
        )}
      </div>

      {result.saved && (
        <div className="mb-4 text-sm px-3 py-2 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {result.savedCount}건이 DB에 저장되었습니다. (Upload ID: {result.uploadId})
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-xs border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="py-2 px-3 font-medium text-left border-b border-gray-200 dark:border-gray-700 text-gray-500">
                #
              </th>
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="py-2 px-3 font-medium text-left border-b border-gray-200 dark:border-gray-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.slice(0, 50).map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-1.5 px-3 text-gray-400">{idx + 1}</td>
                {result.columns.map((col) => (
                  <td key={col} className="py-1.5 px-3">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.totalRows > 50 && (
        <p className="mt-2 text-xs text-gray-500">
          상위 50건만 표시됩니다. (전체 {result.totalRows}건)
        </p>
      )}
    </div>
  );
}
