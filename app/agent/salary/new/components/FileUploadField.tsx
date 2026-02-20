import type { ChangeEvent, RefObject } from "react";

type Props = {
  file: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export function FileUploadField({
  file,
  fileInputRef,
  onFileChange,
  onClear,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        엑셀 파일 <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer"
        />
        {file && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap cursor-pointer"
          >
            초기화
          </button>
        )}
      </div>
      {file && (
        <p className="mt-1 text-xs text-gray-500">
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
}
