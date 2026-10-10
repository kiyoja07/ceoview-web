import EmployeeProfileEditor from "../_components/EmployeeProfileEditor";
import EmployeeBankAccountEditor from "../_components/EmployeeBankAccountEditor";
import { getEmployeePortalUser } from "@/app/employee/_lib/portal";

export const dynamic = "force-dynamic";

export default async function EmployeeSettingsPage() {
  const user = await getEmployeePortalUser();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">내 정보</h1>
          <p className="mt-1 text-sm text-gray-500">
            계정 정보와 급여 계좌를 확인하고 수정할 수 있습니다.
          </p>
        </div>

        {/* 계정 정보 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="text-lg font-semibold text-gray-900">계정 정보</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
            <EmployeeProfileEditor
              initial={{
                email: user.email ?? "",
                phone: user.phone ?? "",
                zipcode: user.zipcode ?? "",
                address: user.address ?? "",
                addressDetail: user.addressDetail ?? "",
              }}
            />
          </div>
        </section>

        {/* 급여 계좌 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="text-lg font-semibold text-gray-900">급여 계좌</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
            <EmployeeBankAccountEditor />
          </div>
        </section>
      </div>
    </main>
  );
}
