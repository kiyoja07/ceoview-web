export default function CompanyBillingPage() {
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            이용 요금 안내
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            서비스 이용 요금에 대한 안내입니다.
          </p>
        </div>

        {/* 무료 이용 안내 */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
          {/* 메인 메시지 */}
          <div className="px-6 py-10 text-center sm:px-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-200">
              <svg
                className="h-7 w-7 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              현재 무료로 이용 중입니다
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              모든 기능을 무료로 이용하실 수 있습니다.
              <br />
              별도의 요금이 청구되지 않으니 안심하고 사용하세요.
            </p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-100" />

          {/* 안내 사항 */}
          <div className="px-6 py-6 sm:px-10">
            <h3 className="text-sm font-semibold text-gray-900">
              요금 관련 안내
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                "현재 서비스 이용에 대한 요금은 없습니다.",
                "향후 유료 전환 시에도, 이용 요금은 담당 세무대리인이 부담합니다.",
                "귀사에 직접 요금이 청구되는 것은 아닙니다.",
                "담당 세무대리인이 귀사에 특별히 제공하는 서비스입니다.",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
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
                  <span className="text-sm text-gray-600">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-100" />

          {/* 강조 배너 */}
          <div className="px-6 py-6 sm:px-10">
            <div className="rounded-xl bg-blue-50 px-5 py-4 ring-1 ring-inset ring-blue-200">
              <div className="flex gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    담당 세무대리인이 제공하는 특별 서비스
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    본 서비스는 담당 세무대리인이 귀사의 급여 업무를 보다
                    효율적으로 지원하기 위해 특별히 제공하는 서비스입니다. 이용
                    요금은 담당 세무대리인이 결제하므로, 귀사에서 별도로
                    부담하실 내용은 없습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
