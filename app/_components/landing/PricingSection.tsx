export default function PricingSection() {
  return (
    <section className="bg-slate-950 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <p className="text-sm font-semibold tracking-wide text-blue-400">
          비용 안내
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
          현재 모든 기능이 무료입니다
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          세무대리인도, 거래처 사장님도, 직원도
          <br className="hidden sm:block" />
          별도의 가입비나 월 이용료 없이 바로 시작할 수 있습니다.
        </p>

        <div className="mx-auto mt-14 grid max-w-2xl gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              세무대리인
            </p>
            <p className="mt-6 text-5xl font-bold tracking-tight text-white">
              ₩ 0원
            </p>
            <p className="mt-2 text-sm text-slate-400">월 이용료</p>
            <ul className="mt-8 space-y-3 text-left text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">✓</span>
                거래처 등록 및 관리
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">✓</span>
                급여 업로드 · 명세서 발급
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">✓</span>
                운영 요청 · 이관 관리
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">✓</span>
                거래처 수 제한 없음
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              거래처 사장님
            </p>
            <p className="mt-6 text-5xl font-bold tracking-tight text-white">
              ₩ 0원
            </p>
            <p className="mt-2 text-sm text-slate-400">월 이용료</p>
            <ul className="mt-8 space-y-3 text-left text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                급여 대시보드
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                직원 포털 · 명세서 조회
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                직원 수 제한 없음
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400">✓</span>
                별도 설치 · 구축 불필요
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-500">
          * 추후 사용량에 따라 요금이 부과될 수 있습니다.
        </p>
      </div>
    </section>
  );
}
