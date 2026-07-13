import { Spinner } from "./Spinner";

export function PageLoading({
  message = "데이터를 불러오는 중입니다…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export function PageError({
  message = "문제가 발생했습니다.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
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
        <p className="max-w-sm text-sm font-medium text-red-600">
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
