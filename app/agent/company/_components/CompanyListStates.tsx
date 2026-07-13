import { ErrorPanel, LoadingPanel } from "@/app/_components/ui/Panel";

export function CompanyListLoading() {
  return <LoadingPanel message="불러오는 중…" card />;
}

export function CompanyListError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return <ErrorPanel message={message} card onRetry={onRetry} />;
}

export function CompanyListEmpty() {
  return (
    <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg
            className="h-7 w-7 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            등록된 거래처가 없습니다
          </p>
          <p className="mt-1 text-xs text-gray-500">
            신규 거래처 등록 버튼을 눌러 거래처를 등록하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
