import type { BizStatusData } from "./shared";

interface BizStatusResultProps {
  bizStatus: BizStatusData;
}

export default function BizStatusResult({ bizStatus }: BizStatusResultProps) {
  return (
    <div
      className={`mt-2 rounded-lg border px-3 py-2.5 text-xs ${
        bizStatus.b_stt_cd === "01"
          ? "border-green-200 bg-green-50 text-green-800"
          : bizStatus.b_stt_cd === "02"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : bizStatus.b_stt_cd === "03"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-gray-200 bg-gray-50 text-gray-800"
      }`}
    >
      <div className="flex items-center gap-1.5 font-medium">
        {bizStatus.b_stt_cd === "01" && (
          <svg
            className="h-4 w-4 text-green-500"
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
        )}
        {bizStatus.b_stt_cd === "02" && (
          <svg
            className="h-4 w-4 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        )}
        {bizStatus.b_stt_cd === "03" && (
          <svg
            className="h-4 w-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        )}
        납세자 상태: {bizStatus.b_stt || "알 수 없음"}
      </div>
      <div className="mt-1 space-y-0.5 text-[11px] opacity-80">
        <p>과세유형: {bizStatus.tax_type || "-"}</p>
        {bizStatus.end_dt && (
          <p>
            폐업일:{" "}
            {bizStatus.end_dt.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}
          </p>
        )}
      </div>
    </div>
  );
}
