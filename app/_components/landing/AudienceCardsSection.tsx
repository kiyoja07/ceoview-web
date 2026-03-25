import ArrowIcon from "./ArrowIcon";

type AudienceCard = {
  audience: "agent" | "company" | "employee";
  label: string;
  title: string;
  description: string;
  buttonLabel: string;
  toneClassName: string;
  buttonClassName: string;
};

const AUDIENCE_CARDS: AudienceCard[] = [
  {
    audience: "agent",
    label: "세무대리인",
    title: "거래처와 운영 요청을\n한 화면에서 관리",
    description: "거래처 목록, 급여 대장, 명세서 발송, 직원 관리",
    buttonLabel: "세무대리인으로 이동",
    toneClassName: "bg-slate-950 text-white",
    buttonClassName: "bg-white text-slate-950 hover:bg-slate-100",
  },
  {
    audience: "company",
    label: "회사 관리자",
    title: "급여 업무와 직원 관리를\n대시보드에서 바로",
    description: "급여 대장 확인, 급여 명세서 발송, 직원 등록",
    buttonLabel: "회사 관리자로 이동",
    toneClassName: "bg-blue-600 text-white",
    buttonClassName: "bg-white text-blue-700 hover:bg-blue-50",
  },
  {
    audience: "employee",
    label: "직원",
    title: "급여 명세서와 내 정보를\n포털에서 직접 확인",
    description: "최근 급여, 월별 명세서, 계좌·개인정보 수정",
    buttonLabel: "직원 포털로 이동",
    toneClassName: "bg-white text-slate-950 ring-1 ring-slate-200",
    buttonClassName: "bg-slate-950 text-white hover:bg-slate-800",
  },
];

export default function AudienceCardsSection({
  audienceHref,
}: {
  audienceHref: Record<"agent" | "company" | "employee", string>;
}) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-blue-600">
          역할별 화면
        </p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          하나의 서비스, 세 개의 역할
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-base text-slate-500">
          운영은 역할별로 분리하고, 데이터 흐름은 하나로 연결합니다.
        </p>

        <div className="mx-auto mt-14 grid max-w-3xl gap-8">
          {AUDIENCE_CARDS.map((card) => (
            <article
              key={card.audience}
              className={`flex flex-col justify-between rounded-3xl p-7 shadow-sm sm:flex-row sm:items-center sm:gap-8 ${card.toneClassName}`}
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
                  {card.label}
                </span>
                <h3 className="mt-5 whitespace-pre-line text-2xl font-bold leading-tight tracking-[-0.02em]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 opacity-70">
                  {card.description}
                </p>
              </div>
              <a
                href={audienceHref[card.audience]}
                className={`group mt-8 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${card.buttonClassName}`}
              >
                {card.buttonLabel}
                <ArrowIcon />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
