import ArrowIcon from "./ArrowIcon";

export default function WhyCeoviewSection({ agentUrl }: { agentUrl: string }) {
  return (
    <section className="bg-slate-950 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-blue-400">
            세무 대리인께 드리는 말씀
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-snug tracking-[-0.03em] text-white sm:text-4xl">
            &ldquo;나도 거래처에
            <br />
            경영 시스템도 같이 제공하고 싶다&rdquo;
          </h2>
          <div className="mt-10 space-y-8">
            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-blue-400">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  거래처는 이제 서비스 품질을 화면으로 체감합니다
                </h3>
                <p className="mt-1 text-sm leading-7 text-slate-400">
                  급여 결과만 전달하던 시대는 끝났습니다. 거래처 사장님과
                  직원들은 대시보드와 포털에서 직접 시스템을 경험하기
                  시작했습니다.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-blue-400">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  시스템을 직접 개발하지 않아도 됩니다
                </h3>
                <p className="mt-1 text-sm leading-7 text-slate-400">
                  세무 전문가이지 개발자가 아닙니다. 복잡한 시스템 개발은
                  저희에게 맡기시고, 세무대리인은 세무대리인 본연의 업무에
                  집중하세요.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-blue-400">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  경영한눈이 세무대리인의 고객용 시스템이 됩니다
                </h3>
                <p className="mt-1 text-sm leading-7 text-slate-400">
                  거래처 사장님은 대시보드를, 직원은 명세서 포털을, 세무대리인은
                  운영 관리를 한곳에서 처리할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-blue-400">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  빨리 시작할수록 경쟁력이 됩니다
                </h3>
                <p className="mt-1 text-sm leading-7 text-slate-400">
                  이미 많은 세무대리인과 거래처가 경영한눈을 사용하기
                  시작했습니다. 세무대리인과 거래처 모두에게 시스템이 제공되는
                  속도가 경쟁력으로 작용하는 시대입니다.
                </p>
              </div>
            </div>
          </div>
          <a
            href={agentUrl}
            className="group mt-12 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            세무대리인으로 시작하기
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
