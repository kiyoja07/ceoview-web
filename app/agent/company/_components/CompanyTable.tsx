import Link from "next/link";
import type { AgentCompanyListItem } from "@/types/agent/company";

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

const CURRENT_YYYYMM = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

type CompanyTableProps = {
  companies: AgentCompanyListItem[];
};

export default function CompanyTable({ companies }: CompanyTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              사업자번호
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              구분
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              상호명
            </th>

            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              대표자명
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              최근수정일시
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
              관리 항목
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {companies.map((company) => (
            <tr
              key={company.id}
              className="transition-colors hover:bg-blue-50/40"
            >
              <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                {formatBusinessNumber(company.businessNumber)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    company.businessType === "INDIVIDUAL"
                      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
                      : "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20"
                  }`}
                >
                  {company.businessType === "INDIVIDUAL" ? "개인" : "법인"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700">
                {company.businessName || (
                  <span className="text-gray-300">—</span>
                )}
              </td>

              <td className="px-4 py-3 text-gray-700">
                {company.representativeName || (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-500">
                {new Date(company.updatedAt).toLocaleString("ko-KR")}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <Link
                    href={`/agent/company/${company.id}/users`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 transition-all hover:bg-emerald-100 active:scale-[0.97]"
                  >
                    사용자
                  </Link>
                  <Link
                    href={`/agent/company/${company.id}/salary-publication`}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 transition-all hover:bg-amber-100 active:scale-[0.97]"
                  >
                    급여
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
