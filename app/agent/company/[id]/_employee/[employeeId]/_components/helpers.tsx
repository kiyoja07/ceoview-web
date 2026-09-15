import {
  display,
  displayInsurance,
  displayYesNo,
  getStatusColor,
} from "@/app/lib/employee-display";
import type { EmployeeFullDetail } from "@/app/_components/EmployeeDetailModal";
import {
  formatResidentNumber,
  maskResidentNumber,
} from "@/app/lib/formatters";

export { display, displayInsurance, displayYesNo, getStatusColor };
export { formatResidentNumber, maskResidentNumber };

export function Field({ label, value }: { label: string; value: string }) {
  const isEmpty = value === "-";
  return (
    <div className="rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-gray-100">
      <dt className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-medium ${isEmpty ? "text-gray-300" : "text-gray-800"}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="mb-3.5 flex items-center gap-2 text-sm font-semibold text-gray-800">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      {title}
    </h3>
  );
}

export const theme = "emerald" as const;

export const colors = {
  focus: "focus:border-emerald-500 focus:ring-emerald-500",
  button: "bg-emerald-600 hover:bg-emerald-700",
  badge: "bg-emerald-50 text-emerald-700",
};

export type EmployeeFormState = {
  formEmployeeCode: string;
  formName: string;
  formResidentNumber: string;
  formNationalityType: string;
  formJobCategory: string;
  formResidenceType: string;
  formDepartment: string;
  formPositionTitle: string;
  formEmail: string;
  formPhone: string;
  formLandlinePhone: string;
  formHireDate: string;
  formResignDate: string;
  formAddress: { zipcode: string; address: string; addressDetail: string };
  formHasSpouse: string;
  formDependentUnder20: string;
  formDependentOver60: string;
  formDeductionSenior: string;
  formDeductionDisabled: string;
  formDeductionWomen: string;
  formDeductionChildren: string;
  formDeductionBirthAdoption: string;
  formDeductionSingleParent: string;
  formEmploymentInsurance: string;
  formPayGrade: string;
  formNationalPension: string;
  formHealthInsurance: string;
  formBankAccounts: {
    id?: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
};

export function populateFormFromEmployee(
  emp: EmployeeFullDetail,
): EmployeeFormState {
  return {
    formEmployeeCode: emp.employeeCode ?? "",
    formName: emp.name,
    formResidentNumber: emp.residentNumber ?? "",
    formNationalityType: emp.nationalityType ?? "",
    formJobCategory: emp.jobCategory ?? "",
    formResidenceType: emp.residenceType ?? "",
    formDepartment: emp.department ?? "",
    formPositionTitle: emp.positionTitle ?? "",
    formEmail: emp.email ?? "",
    formPhone: emp.phone && emp.phone.replace(/\D/g, "") ? emp.phone : "",
    formLandlinePhone:
      emp.landlinePhone && emp.landlinePhone.replace(/\D/g, "")
        ? emp.landlinePhone
        : "",
    formHireDate: emp.hireDate ?? "",
    formResignDate: emp.resignDate ?? "",
    formAddress: {
      zipcode: emp.zipcode ?? "",
      address: emp.address ?? "",
      addressDetail: emp.addressDetail ?? "",
    },
    formHasSpouse: emp.hasSpouse ?? "",
    formDependentUnder20: emp.dependentUnder20 ?? "",
    formDependentOver60: emp.dependentOver60 ?? "",
    formDeductionSenior: emp.deductionSenior ?? "",
    formDeductionDisabled: emp.deductionDisabled ?? "",
    formDeductionWomen: emp.deductionWomen ?? "",
    formDeductionChildren: emp.deductionChildren ?? "",
    formDeductionBirthAdoption: emp.deductionBirthAdoption ?? "",
    formDeductionSingleParent: emp.deductionSingleParent ?? "",
    formEmploymentInsurance: emp.employmentInsurance ?? "",
    formPayGrade: emp.payGrade ?? "",
    formNationalPension: emp.nationalPension ?? "",
    formHealthInsurance: emp.healthInsurance ?? "",
    formBankAccounts: emp.bankAccounts.map((ba) => ({
      id: ba.id,
      bankName: ba.bankName,
      accountNumber: ba.accountNumber,
      accountHolder: ba.accountHolder,
    })),
  };
}
