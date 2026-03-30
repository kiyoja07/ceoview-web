import Image from "next/image";

const benefits = [
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
        />
      </svg>
    ),
    title: "클릭 한 번이면 전 직원에게 발송 완료",
    description:
      "급여 데이터를 등록하면 직원별 급여 명세서가 자동으로 생성되어 전달됩니다. 일일이 보낼 필요 없습니다.",
    color: "bg-blue-600/15 text-blue-700",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
    title: "직원은 개인 포털에서 체계적으로 확인",
    description:
      "본인 전용 포털에서 월별 명세서를 확인하고, 지급·공제 내역을 한눈에 파악할 수 있습니다.",
    color: "bg-emerald-600/15 text-emerald-700",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    title: "급여 문의 감소, 업무 부담 경감",
    description:
      "직원이 직접 명세서를 확인하므로 급여 관련 문의가 줄어들어 사장님과 세무대리인 모두 편해집니다.",
    color: "bg-amber-600/15 text-amber-700",
  },
] as const;

export default function PayslipDeliverySection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-700">
              급여 명세서 자동 전송
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-snug tracking-[-0.03em] text-slate-950 sm:text-4xl">
              급여 명세서,
              <br />
              <span className="text-blue-700">이제 일일이 보내지 마세요</span>
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
              급여를 등록하면 전 직원에게 명세서가 자동으로 전달됩니다.
              <br className="hidden sm:block" />
              사장님은 클릭 한 번, 직원은 직접 조회 — 서로 편해집니다.
            </p>

            <div className="mt-10 space-y-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${benefit.color}`}
                  >
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — screenshot */}
          <div className="relative">
            <Image
              src="https://ceoview.edge.naverncp.com/screenshot/screenshot-person-salary-details.png"
              alt="직원 급여 명세서 상세 화면"
              width={1920}
              height={1080}
              className="w-full rounded-2xl"
              priority
            />
            <p className="mt-3 text-center text-xs text-slate-400">
              직원 개인 포털 — 급여 명세서 상세 화면
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
