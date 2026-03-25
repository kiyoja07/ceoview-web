import type { ShowcaseScenario } from "./showcase-utils";
import { formatCurrency } from "./showcase-utils";
import { SectionLabel } from "./ShowcaseUI";

export default function SalaryUploadSection({
  scenario,
}: {
  scenario: ShowcaseScenario;
}) {
  const upload = scenario.salaryUpload;

  return (
    <section id="salary-upload" className="space-y-4">
      <div>
        <SectionLabel>Actual Screen Based</SectionLabel>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          급여 엑셀 등록
        </h2>
      </div>
      <div className="overflow-hidden rounded-[2rem] shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)]">
        <div className="min-h-screen bg-app-bg">
          <div className="mx-auto max-w-5xl p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
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
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    급여 엑셀 등록
                  </h1>
                  <p className="text-sm text-gray-500">
                    엑셀 파일을 업로드하여 급여 데이터를 등록합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="mb-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              {/* 사업자 선택 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  등록 대상 사업자
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
                  <svg
                    className="h-4 w-4 shrink-0 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                    />
                  </svg>
                  {upload.businessNumber} / {upload.companyName}
                </div>
              </div>

              {/* 소득유형 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  소득유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {["근로소득", "일용소득", "사업소득", "기타소득"].map(
                    (type) => (
                      <div
                        key={type}
                        className={`flex items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${
                          type === upload.incomeTypeLabel
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {type}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* 귀속/지급년월 2열 */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    귀속년월 <span className="text-red-500">*</span>
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900">
                    {upload.accrualYm}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    지급년월 <span className="text-red-500">*</span>
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900">
                    {upload.paymentYm}
                  </div>
                </div>
              </div>

              {/* 지급일 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  지급일 <span className="text-red-500">*</span>
                </label>
                <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900">
                  {upload.payDate}
                </div>
              </div>

              {/* 프로그램 종류 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  프로그램 종류 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "위하고",
                      selected: upload.programTypeLabel === "위하고",
                    },
                    {
                      label: "세무사랑",
                      selected: upload.programTypeLabel === "세무사랑",
                      disabled: true,
                    },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className={`flex items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${
                        opt.disabled
                          ? "border-gray-100 bg-gray-50 text-gray-400"
                          : opt.selected
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20"
                            : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {opt.label}
                      {opt.disabled && (
                        <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          준비 중
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 파일 업로드 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  엑셀 파일 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {upload.fileName}
                      </p>
                      <p className="text-xs text-gray-400">{upload.fileSize}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 성공 메시지 */}
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {upload.incomeTypeLabel} 엑셀 데이터 추출 완료 —{" "}
                {upload.totalRows}건
              </div>

              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-blue-400 py-2.5 text-sm font-medium text-white shadow-none"
              >
                엑셀 파일 등록하기
              </button>
            </div>

            {/* Result Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      추출 결과 미리보기
                    </h3>
                    <p className="text-sm text-gray-500">
                      {upload.incomeTypeLabel} · {upload.totalRows}건
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    발행 완료
                  </span>
                </div>
              </div>

              {/* 테이블 */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        코드
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        성명
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        부서
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        직급
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-blue-600">
                        총 지급액
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-rose-500">
                        총 공제액
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-emerald-600">
                        차인지급액
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upload.rows.map((row) => (
                      <tr
                        key={row.employeeCode}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                          {row.employeeCode}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                          {row.employeeName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {row.department}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                          {row.position}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(row.totalPayment)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(row.totalDeduction)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-700">
                          {formatCurrency(row.netPayment)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-sm font-semibold text-gray-700"
                      >
                        합계 (미리보기 {upload.rows.length}건 / 전체{" "}
                        {upload.totalRows}건)
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(
                          upload.rows.reduce((s, r) => s + r.totalPayment, 0),
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(
                          upload.rows.reduce((s, r) => s + r.totalDeduction, 0),
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-700">
                        {formatCurrency(
                          upload.rows.reduce((s, r) => s + r.netPayment, 0),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
