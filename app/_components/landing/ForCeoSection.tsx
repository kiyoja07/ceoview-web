import Image from "next/image";
import Link from "next/link";
import ArrowIcon from "./ArrowIcon";

export default function ForCeoSection({ companyUrl }: { companyUrl: string }) {
  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#80b5ff] to-[#8989fc] opacity-15 sm:left-[calc(50%+20rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-wide text-emerald-600">
              사장님께 드리는 말씀
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-snug tracking-[-0.03em] text-slate-950 sm:text-4xl">
              세무 서비스, 이제 결과물만 받지 마세요
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
              급여 결과 확인부터 직원 명세서 조회까지
              <br className="hidden sm:block" />
              사장님도 직접 확인하고 이용할 수 있는 시스템이 필요합니다
            </p>

            <div className="mt-10 space-y-8">
              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-600">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    급여 결과를 직접 확인하세요
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    엑셀이나 메신저로 전달받는 대신, 대시보드에서 바로 확인할 수
                    있습니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-600">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    세무대리인이 등록하면 바로 시작
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    사장님 전용 대시보드와 직원 명세서 포털이 즉시 열립니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-600">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    별도 구축 없이 부담 제로
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    복잡한 설치나 세팅 없이, 가입 즉시 사용할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href={companyUrl}
              className="group mt-12 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              회사 관리자 화면 보기
              <ArrowIcon />
            </Link>
          </div>

          {/* Right — screenshot */}
          <div className="relative">
            <Image
              src="https://ceoview.edge.naverncp.com/example-screen/salary-table.png"
              alt="경영한눈 급여 대장 화면"
              width={1920}
              height={1080}
              className="w-full rounded-2xl"
              priority
            />
            <p className="mt-3 text-center text-xs text-slate-400">
              실제 경영한눈 급여 대장 화면
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
