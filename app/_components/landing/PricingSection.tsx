type PricingCardProps = {
  title: string;
  accentClassName: string;
  priceClassName?: string;
  features: string[];
};

function PricingCard({
  title,
  accentClassName,
  priceClassName = "mt-2",
  features,
}: PricingCardProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${accentClassName}`}
      >
        {title}
      </p>
      <div className="mt-6 h-24">
        <p
          className={`${priceClassName} text-5xl font-bold tracking-tight text-white`}
        >
          ₩ 0원
        </p>
      </div>

      <ul className="mt-auto space-y-3 pt-8 text-left text-sm leading-6 text-slate-300">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className={`mt-0.5 ${accentClassName}`}>✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

const pricingPlans = [
  {
    title: "세무대리인",
    accentClassName: "text-blue-400",
    priceClassName: "mt-6",
    features: [
      "거래처 등록 및 관리",
      "급여 · 명세서 발급",
      "기장 프로그램 연동",
    ],
  },
  {
    title: "거래처 사장님",
    accentClassName: "text-emerald-400",
    priceClassName: "mt-6",
    features: ["급여 대시보드", "직원 포털 · 명세서 조회", "직원 수 제한 없음"],
  },
] satisfies PricingCardProps[];

export default function PricingSection() {
  return (
    <section className="bg-slate-950 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <p className="text-sm font-semibold tracking-wide text-blue-400">
          비용 안내
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
          무료입니다
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          세무대리인도, 거래처 사장님도, 직원도
          <br className="hidden sm:block" />
          별도의 가입비나 월 이용료 없이 바로 시작할 수 있습니다.
        </p>

        <div className="mx-auto mt-14 grid max-w-2xl gap-5 sm:grid-cols-2">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.title} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
