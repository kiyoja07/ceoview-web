import Image from "next/image";

const steps = [
  {
    number: "1",
    title: "위하고에서 기존대로 작업",
    description: "평소 쓰시던 세무 프로그램에서 그대로 처리하세요.",
  },
  {
    number: "2",
    title: "엑셀 다운로드",
    description: "내려받은 파일을 따로 가공하거나 정리할 필요 없습니다.",
  },
  {
    number: "3",
    title: "경영한눈에 업로드하면 끝",
    description: "파일을 올리는 순간 급여 데이터가 반영됩니다. 이중 작업 제로.",
  },
] as const;

export default function WehagoUploadSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-cyan-700">
              간편한 데이터 연동
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-snug tracking-[-0.03em] text-slate-950 sm:text-4xl">
              세무 프로그램은 이미 쓰고 계시죠?
              <br />
              <span className="text-cyan-700">
                경영한눈까지 또 작업할 필요 없습니다
              </span>
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
              위하고에서 다운받은 엑셀을 그대로 올리기만 하면 급여 데이터가
              자동으로 반영됩니다. 추가 입력은 없습니다.
            </p>

            <div className="mt-10 space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600/15 text-sm font-bold text-cyan-700">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — screenshot */}
          <div className="relative">
            <Image
              src="https://ceoview.edge.naverncp.com/screenshot/screenshot-excel-upload.png"
              alt="경영한눈 엑셀 업로드 화면"
              width={1920}
              height={1080}
              className="w-full rounded-2xl"
              priority
            />
            <p className="mt-3 text-center text-xs text-slate-400">
              경영한눈 엑셀 업로드 화면
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
