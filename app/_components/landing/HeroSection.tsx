import Link from "next/link";
import ArrowIcon from "./ArrowIcon";

export default function HeroSection({ showcaseUrl }: { showcaseUrl: string }) {
  return (
    <section className="relative overflow-hidden pb-24 pt-20 lg:pt-32">
      {/* 배경 장식 — 상단 */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80b5ff] to-[#8989fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      {/* 배경 장식 — 하단 */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#80b5ff] to-[#8989fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold tracking-wide text-blue-600">
          세무 플랫폼을 부러워 할 필요 없습니다
        </p>
        <h1 className="mt-4 text-center text-[2.75rem] font-bold leading-[1.15] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
          이제 거래처에
          <br />
          <span className="text-blue-600">당당하게 시스템까지 제공하세요</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-7 text-slate-500 sm:text-lg">
          급여 관리, 직원 포털, 운영 요청까지
          <br className="hidden sm:block" />
          세무대리인의 전문성을 더 체계적으로 보여주는 고객용 시스템입니다
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={showcaseUrl}
            className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            시스템 예시 화면 먼저 보기
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
