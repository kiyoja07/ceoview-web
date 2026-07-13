import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMMON_ACTION_LABELS } from "@/catalogs/ko/common";
import {
  getEmployeeStatus,
  type EmployeeIncomeFilter,
  type EmployeeStatusFilter,
} from "@/types/company/employees";
import {
  getBirthDate,
  getIncomeTypeTone,
  getStatusTone,
} from "./utils";
import type { DashboardEmployeeRow, EmployeeSortOption } from "./types";

type EmployeeTableProps = {
  employees: DashboardEmployeeRow[];
  listLoading: boolean;
  listError: string | null;
  search: string;
  incomeTypeFilter: EmployeeIncomeFilter;
  statusFilter: EmployeeStatusFilter;
  page: number;
  totalPages: number;
  sortOption: EmployeeSortOption;
  onPageChange: (page: number) => void;
  onSortOptionChange: (value: EmployeeSortOption) => void;
};

export default function EmployeeTable({
  employees,
  listLoading,
  listError,
  search,
  incomeTypeFilter,
  statusFilter,
  page,
  totalPages,
  sortOption,
  onPageChange,
  onSortOptionChange,
}: EmployeeTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-950/5">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          지급 대상자 목록
        </h2>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          정렬
          <select
            value={sortOption}
            onChange={(event) =>
              onSortOptionChange(event.target.value as EmployeeSortOption)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="NAME">이름순</option>
            <option value="EMPLOYEE_CODE">사원코드순</option>
          </select>
        </label>
      </div>

      {listLoading ? (
        <div className="p-10 text-center text-sm text-gray-500">
          지급 대상자 목록을 불러오는 중...
        </div>
      ) : listError ? (
        <div className="p-10 text-center text-sm text-red-600">{listError}</div>
      ) : employees.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-gray-500">
            {search || incomeTypeFilter !== "ALL" || statusFilter !== "ALL"
              ? "현재 필터 조건에 맞는 지급 대상자가 없습니다."
              : "등록된 지급 대상자가 없습니다. 먼저 지급 대상자를 등록해주세요."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  <th className="px-5 py-3 text-left">소득유형</th>
                  <th className="px-5 py-3 text-left">사원코드</th>
                  <th className="px-5 py-3 text-left">이름</th>
                  <th className="px-5 py-3 text-left">생년월일</th>
                  <th className="px-5 py-3 text-left">재직상태</th>
                  <th className="px-5 py-3 text-left">연락처</th>
                  <th className="px-5 py-3 text-left">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((employee) => {
                  const status = getEmployeeStatus(
                    employee.hireDate,
                    employee.resignDate,
                  );
                  const employeeDetailPath = `/company/employees/${employee.id}?incomeType=${employee.incomeType}`;
                  const isRowClickable = employee.canViewDetail;

                  return (
                    <tr
                      key={`${employee.incomeType}-${employee.id}`}
                      onClick={() => {
                        if (!isRowClickable) return;
                        router.push(employeeDetailPath);
                      }}
                      onKeyDown={(event) => {
                        if (!isRowClickable) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        router.push(employeeDetailPath);
                      }}
                      tabIndex={isRowClickable ? 0 : undefined}
                      className={`align-top hover:bg-gray-50/70 ${
                        isRowClickable
                          ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getIncomeTypeTone(employee.incomeType)}`}
                          >
                            {employee.incomeTypeLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-900">
                          {employee.employeeCode ?? "-"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {employee.name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-900">
                          {getBirthDate(employee.residentNumber)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusTone(status)}`}
                          >
                            {status ?? "미확인"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        <div className="mt-1 text-xs text-gray-500">
                          {employee.phone || "연락처 미등록"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {employee.email || "이메일 미등록"}
                        </div>

                        {employee.bankAccount && (
                          <div className="mt-2 text-xs text-gray-500">
                            {employee.bankAccount.bankName} ·{" "}
                            {employee.bankAccount.accountHolder}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          {employee.canViewDetail ? (
                            <Link
                              href={employeeDetailPath}
                              className="inline-flex rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              {COMMON_ACTION_LABELS.detail}
                            </Link>
                          ) : (
                            <span className="inline-flex rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                              통합 조회
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                {COMMON_ACTION_LABELS.previous}
              </button>
              <span className="text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                {COMMON_ACTION_LABELS.next}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
