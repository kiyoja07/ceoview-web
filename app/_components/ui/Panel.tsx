import { Spinner } from "./Spinner";

const CARD_CLASS = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5";

export function LoadingPanel({
  message = "데이터를 불러오는 중…",
  className = "py-20",
  card = false,
}: {
  message?: string;
  className?: string;
  card?: boolean;
}) {
  return (
    <div className={`flex items-center justify-center ${className} ${card ? CARD_CLASS : ""}`}>
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export function ErrorPanel({
  message,
  className = "py-20",
  card = false,
  onRetry,
}: {
  message: string;
  className?: string;
  card?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className={`flex items-center justify-center ${className} ${card ? CARD_CLASS : ""}`}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-600">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
