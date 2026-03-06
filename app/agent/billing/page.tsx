export default function AgentBillingPage() {
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            요금 안내
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            서비스 이용 요금에 대한 안내입니다.
          </p>
        </div>

        {/* 무료 이용 안내 */}
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-inset ring-amber-200">
          <div className="flex gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
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
            <div>
              <p className="text-sm font-medium text-amber-800">
                현재 무료 이용 기간입니다
              </p>
              <p className="mt-1 text-sm text-amber-700">
                정식 오픈 전까지 모든 기능을 무료로 이용하실 수 있습니다. 결제
                시작 시점은 사전에 안내드리겠습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 요금 카드 */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
          {/* 가격 섹션 */}
          <div className="px-6 py-8 text-center sm:px-10">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
              종량제
            </span>
            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                2,200
              </span>
              <span className="text-lg font-semibold text-gray-500">원</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              거래처 1곳 · 1개월 기준 · 부가세 포함
            </p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-100" />

          {/* 상세 설명 */}
          <div className="px-6 py-6 sm:px-10">
            <h3 className="text-sm font-semibold text-gray-900">
              요금 산정 기준
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                "해당 월에 급여를 등록한 거래처 수만큼만 과금됩니다.",
                "급여를 등록하지 않은 거래처는 요금이 부과되지 않습니다.",
                "거래처당 월 2,200원(부가세 포함)이 청구됩니다.",
                "별도의 기본료나 가입비는 없습니다.",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
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

          {/* 예시 */}
          <div className="px-6 py-6 sm:px-10">
            <h3 className="text-sm font-semibold text-gray-900">요금 예시</h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-medium text-gray-600">
                      급여 등록 거래처 수
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">
                      월 이용 요금
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { count: "5곳", price: "11,000원" },
                    { count: "10곳", price: "22,000원" },
                    { count: "30곳", price: "66,000원" },
                    { count: "50곳", price: "110,000원" },
                    { count: "100곳", price: "220,000원" },
                  ].map((row) => (
                    <tr key={row.count}>
                      <td className="px-4 py-2.5 text-gray-700">{row.count}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                        {row.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
