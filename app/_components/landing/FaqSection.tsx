const FAQ_ITEMS = [
  {
    question: "경영한눈은 무료인가요?",
    answer:
      "네, 현재 모든 기능을 무료로 이용할 수 있습니다. 별도의 가입비나 월 이용료 없이 바로 시작하실 수 있습니다.",
  },
  {
    question: "거래처 사장님께 어떻게 소개하면 좋을까요?",
    answer: "  ",
  },
  {
    question: "세무대리인과 회사는 어떻게 연결되나요?",
    answer:
      "세무대리인이 사업자등록번호로 회사를 등록하면, 회사 사용자에게 초대 링크가 전달됩니다. 회사 사용자가 수락하면 자동으로 연결됩니다.",
  },
  {
    question: "직원은 어떻게 급여명세서를 확인하나요?",
    answer:
      "회사에서 급여를 업로드하면, 직원 포털에서 본인의 월별 급여명세서를 바로 확인할 수 있습니다. 별도의 앱 설치 없이 웹 브라우저에서 이용할 수 있습니다.",
  },
  {
    question: "급여 데이터는 안전하게 보관되나요?",
    answer:
      "모든 데이터는 암호화되어 안전하게 저장되며, 역할별로 접근 권한이 분리되어 있어 허가된 사용자만 해당 데이터를 조회할 수 있습니다.",
  },
  {
    question: "어떤 소득유형을 지원하나요?",
    answer:
      "근로소득, 사업소득, 기타소득, 일용직소득을 모두 지원합니다. 각 소득유형별로 지급 대상자를 별도로 관리할 수 있습니다.",
  },
];

function ChevronIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group py-6">
      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-slate-900">
        {question}
        <ChevronIcon />
      </summary>
      <p className="mt-3 text-sm leading-7 text-slate-500">{answer}</p>
    </details>
  );
}

export default function FaqSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-blue-600">FAQ</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          자주 묻는 질문
        </h2>

        <div className="mt-12 divide-y divide-slate-200">
          {FAQ_ITEMS.map((item) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
