const TESTIMONIAL_ITEMS = [
  {
    quote:
      "거래처 사장님께 시스템을 보여드린 뒤 반응이 완전히 달라졌습니다. 이제는 단순한 세무 처리를 넘어, 회사를 함께 관리해주는 파트너로 봐주십니다.",
    name: "오세진 세무사",
    detail: "세무법인 · 거래처 40곳",
    initial: "오",
    color: "bg-blue-100 text-blue-600",
  },
  {
    quote:
      "월말마다 카톡으로 급여 자료를 요청하던 번거로움이 사라졌습니다. 필요한 자료를 시스템에서 바로 확인하니, 저희도 거래처도 훨씬 편해졌어요.",
    name: "유민정 세무사",
    detail: "세무사무소 · 거래처 25곳",
    initial: "유",
    color: "bg-slate-200 text-slate-700",
  },
  {
    quote:
      "직원 30명 급여를 엑셀로 관리할 때는 매달 반나절이 걸렸는데, 지금은 30분이면 끝납니다. 반복 업무가 줄어드니 정말 편합니다.",
    name: "김민수 대표",
    detail: "제조업 · 직원 30명",
    initial: "김",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    quote:
      "다른 업체 시스템을 보며 아쉬웠는데, 이제는 우리 사무소도 거래처에 자체 시스템을 제공할 수 있게 됐습니다. 서비스 경쟁력이 확실히 달라졌어요.",
    name: "장현우 세무사",
    detail: "세무사무소 · 거래처 18곳",
    initial: "장",
    color: "bg-violet-100 text-violet-600",
  },
  {
    quote:
      "세무대리인과 시스템이 연결되어 있으니 급여 자료 전달이 훨씬 매끄럽습니다. 월말마다 챙기던 스트레스가 크게 줄었어요.",
    name: "최서연 실장",
    detail: "부동산 · 직원 12명",
    initial: "최",
    color: "bg-rose-100 text-rose-600",
  },
  {
    quote:
      "직원들이 급여명세서를 직접 확인할 수 있어서 문의가 눈에 띄게 줄었습니다. 사업소득자까지 한 번에 관리되니 실무가 훨씬 단순해졌어요.",
    name: "이준호 원장",
    detail: "병원 · 직원 22명",
    initial: "이",
    color: "bg-amber-100 text-amber-600",
  },
  {
    quote:
      "여러 지점 직원을 한 곳에서 관리할 수 있다는 점이 가장 만족스럽습니다. 지점별 급여 현황도 바로 비교할 수 있어 운영이 훨씬 수월해졌어요.",
    name: "한동훈 대표",
    detail: "외식업 · 직원 45명",
    initial: "한",
    color: "bg-cyan-100 text-cyan-600",
  },
];

function TestimonialCard({
  quote,
  name,
  detail,
  initial,
  color,
}: (typeof TESTIMONIAL_ITEMS)[number]) {
  return (
    <article className="w-[320px] shrink-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm leading-7 text-slate-500">&ldquo;{quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${color}`}
        >
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">{detail}</p>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-blue-600">
          도입 사례
        </p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          세무대리인과 사장님이 함께 쓰고 있습니다
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-base text-slate-500">
          경영한눈을 도입한 세무대리인과 거래처 사장님들의 이야기입니다.
        </p>

        <div className="relative mt-14">
          <div className="flex gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TESTIMONIAL_ITEMS.map((item) => (
              <TestimonialCard key={item.name} {...item} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-50" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50" />
        </div>
      </div>
    </section>
  );
}
