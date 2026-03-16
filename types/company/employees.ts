export type EmployeeStatus = "재직중" | "입사예정" | "퇴사완료" | "퇴사예정";

export function getEmployeeStatus(
  hireDate: string | null,
  resignDate: string | null,
): EmployeeStatus | null {
  const today = new Date().toISOString().slice(0, 10);

  if (resignDate) {
    return resignDate <= today ? "퇴사완료" : "퇴사예정";
  }

  if (hireDate) {
    return hireDate <= today ? "재직중" : "입사예정";
  }

  return null;
}

export type EmployeeBankAccountItem = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type EmployeeItem = {
  id: string;
  employeeCode: string | null;
  name: string;
  residentNumber: string | null;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  resignDate: string | null;
  status: EmployeeStatus | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
  bankAccounts: EmployeeBankAccountItem[];
  createdAt: string;
  updatedAt: string;
};

export type EmployeeListResponse = {
  employees: EmployeeItem[];
  total: number;
};

export type EmployeeDetailResponse = EmployeeItem;

export type EmployeeBankAccountBody = {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type EmployeeCreateBody = {
  employeeCode?: string | null;
  name: string;
  residentNumber?: string | null;
  nationalityType?: string | null;
  jobCategory?: string | null;
  residenceType?: string | null;
  department?: string | null;
  positionTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  landlinePhone?: string | null;
  hireDate?: string | null;
  resignDate?: string | null;
  zipcode?: string | null;
  address?: string | null;
  addressDetail?: string | null;
  hasSpouse?: string | null;
  dependentUnder20?: string | null;
  dependentOver60?: string | null;
  deductionSenior?: string | null;
  deductionDisabled?: string | null;
  deductionWomen?: string | null;
  deductionChildren?: string | null;
  deductionBirthAdoption?: string | null;
  deductionSingleParent?: string | null;
  employmentInsurance?: string | null;
  payGrade?: string | null;
  nationalPension?: string | null;
  healthInsurance?: string | null;
  bankAccounts?: EmployeeBankAccountBody[];
};

export type EmployeeUpdateBody = EmployeeCreateBody;

export type EmployeeDeleteBody = {
  employeeId: string;
};
