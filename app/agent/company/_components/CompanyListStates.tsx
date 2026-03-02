export function CompanyListLoading() {
  return (
    <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex flex-col items-center justify-center gap-3">
        <svg
          className="h-8 w-8 animate-spin text-blue-500"
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
        <p className="text-sm text-gray-500">불러오는 중…</p>
      </div>
    </div>
  );
}

export function CompanyListError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-950/5">
      <div className="flex flex-col items-center justify-center gap-2">
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <p className="text-sm text-red-600">{message}</p>
      </div>
    </div>
  );
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
