import Link from "next/link";
import { formatBusinessNumber } from "@/app/lib/formatters";
import type { AgentCompanyListItem } from "@/types/agent/company";

type CompanyTableProps = {
  companies: AgentCompanyListItem[];
};

const tableHeaders = [
  "상호명",
  "사업자번호",
  "구분",
  "대표자명",
  "최근수정일시",
  "관리 항목",
];

const companyActions = [
  {
    label: "개요",
    path: "",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-600/10 hover:bg-slate-200",
  },
  {
    label: "재무",
    path: "/financial-report/generate",
    className:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 hover:bg-blue-100",
  },
  // {
  //   label: "직원",
  //   path: "/employees",
  //   className:
  //     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 hover:bg-emerald-100",
  // },
  // {
  //   label: "급여",
  //   path: "/salary",
  //   className:
  //     "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 hover:bg-amber-100",
  // },
];

export default function CompanyTable({ companies }: CompanyTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {tableHeaders.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {companies.map((company) => (
            <tr
              key={company.id}
              className="transition-colors hover:bg-blue-50/40"
            >
              <td className="px-4 py-3 text-gray-700">
                <Link
                  href={`/agent/company/${company.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  {company.businessName || (
                    <span className="text-gray-300">—</span>
                  )}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                <Link
                  href={`/agent/company/${company.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  {formatBusinessNumber(company.businessNumber)}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link href={`/agent/company/${company.id}`}>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      company.businessType === "INDIVIDUAL"
                        ? "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
                        : "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20"
                    }`}
                  >
                    {company.businessType === "INDIVIDUAL" ? "개인" : "법인"}
                  </span>
                </Link>
              </td>

              <td className="px-4 py-3 text-gray-700">
                <Link
                  href={`/agent/company/${company.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  {company.representativeName || (
                    <span className="text-gray-300">—</span>
                  )}
                </Link>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-500">
                <Link
                  href={`/agent/company/${company.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  {new Date(company.updatedAt).toLocaleString("ko-KR")}
                </Link>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  {companyActions.map(({ label, path, className }) => (
                    <Link
                      key={label}
                      href={`/agent/company/${company.id}${path}`}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${className}`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
