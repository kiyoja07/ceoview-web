import type { CompanyInfoUpdateBody } from "@/types/company/users";
import type {
  EmployeeBankAccountBody,
  EmployeeCreateBody,
  BusinessIncomeEmployeeCreateBody,
  OtherIncomeEmployeeCreateBody,
  OtherIncomeLaborEmployeeCreateBody,
} from "@/types/company/employees";

type NullableStringFields<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K];
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeEmployeePayload(
  body: EmployeeCreateBody,
): EmployeeCreateBody {
  return {
    employeeCode: normalizeString(body.employeeCode),
    name: normalizeString(body.name) ?? "",
    residentNumber: normalizeString(body.residentNumber),
    nationalityType: normalizeString(body.nationalityType),
    jobCategory: normalizeString(body.jobCategory),
    residenceType: normalizeString(body.residenceType),
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    landlinePhone: normalizeString(body.landlinePhone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
    zipcode: normalizeString(body.zipcode),
    address: normalizeString(body.address),
    addressDetail: normalizeString(body.addressDetail),
    hasSpouse: normalizeString(body.hasSpouse),
    dependentUnder20: normalizeString(body.dependentUnder20),
    dependentOver60: normalizeString(body.dependentOver60),
    deductionSenior: normalizeString(body.deductionSenior),
    deductionDisabled: normalizeString(body.deductionDisabled),
    deductionWomen: normalizeString(body.deductionWomen),
    deductionChildren: normalizeString(body.deductionChildren),
    deductionBirthAdoption: normalizeString(body.deductionBirthAdoption),
    deductionSingleParent: normalizeString(body.deductionSingleParent),
    employmentInsurance: normalizeString(body.employmentInsurance),
    payGrade: normalizeString(body.payGrade),
    nationalPension: normalizeString(body.nationalPension),
    healthInsurance: normalizeString(body.healthInsurance),
    bankAccounts:
      body.bankAccounts
        ?.map((bankAccount) => sanitizeBankAccount(bankAccount))
        .filter((bankAccount): bankAccount is EmployeeBankAccountBody =>
          Boolean(bankAccount),
        ) ?? [],
  };
}

function sanitizeBankAccount(
  bankAccount: EmployeeBankAccountBody,
): EmployeeBankAccountBody | null {
  const bankName = normalizeString(bankAccount.bankName);
  const accountNumber = normalizeString(bankAccount.accountNumber);
  const accountHolder = normalizeString(bankAccount.accountHolder);

  if (!bankName && !accountNumber && !accountHolder) {
    return null;
  }

  return {
    id: normalizeString(bankAccount.id) ?? undefined,
    bankName: bankName ?? "",
    accountNumber: accountNumber ?? "",
    accountHolder: accountHolder ?? "",
  };
}

function sanitizeBankAccounts(
  bankAccounts: EmployeeBankAccountBody[] | null | undefined,
  fallback?: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountHolder?: string | null;
  },
): EmployeeBankAccountBody[] {
  const sanitizedAccounts =
    bankAccounts
      ?.map((bankAccount) => sanitizeBankAccount(bankAccount))
      .filter((bankAccount): bankAccount is EmployeeBankAccountBody =>
        Boolean(bankAccount),
      ) ?? [];

  if (sanitizedAccounts.length > 0) {
    return sanitizedAccounts;
  }

  const fallbackAccount = sanitizeBankAccount({
    bankName: fallback?.bankName ?? "",
    accountNumber: fallback?.accountNumber ?? "",
    accountHolder: fallback?.accountHolder ?? "",
  });

  return fallbackAccount ? [fallbackAccount] : [];
}

export function sanitizeCompanyInfoPayload(
  body: CompanyInfoUpdateBody,
): CompanyInfoUpdateBody {
  return {
    businessName: normalizeString(body.businessName),
    representativeName: normalizeString(body.representativeName),
    openingDate: normalizeString(body.openingDate),
    zipcode: normalizeString(body.zipcode),
    address: normalizeString(body.address),
    addressDetail: normalizeString(body.addressDetail),
  };
}

export function sanitizeBusinessIncomeEmployeePayload(
  body: BusinessIncomeEmployeeCreateBody,
): BusinessIncomeEmployeeCreateBody {
  return {
    employeeCode: normalizeString(body.employeeCode),
    name: normalizeString(body.name) ?? "",
    residentNumber: normalizeString(body.residentNumber),
    nationalityType: normalizeString(body.nationalityType),
    incomeCategory: normalizeString(body.incomeCategory),
    residenceType: normalizeString(body.residenceType),
    businessName: normalizeString(body.businessName),
    businessRegistrationNumber: normalizeString(
      body.businessRegistrationNumber,
    ),
    businessAddress: normalizeString(body.businessAddress),
    address: normalizeString(body.address),
    addressDetail: normalizeString(body.addressDetail),
    zipcode: normalizeString(body.zipcode),
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
    bankAccounts: sanitizeBankAccounts(body.bankAccounts),
  };
}

export function sanitizeOtherIncomeEmployeePayload(
  body: OtherIncomeEmployeeCreateBody,
): OtherIncomeEmployeeCreateBody {
  return {
    employeeCode: normalizeString(body.employeeCode),
    name: normalizeString(body.name) ?? "",
    residentNumber: normalizeString(body.residentNumber),
    nationalityType: normalizeString(body.nationalityType),
    incomeCategory: normalizeString(body.incomeCategory),
    residenceType: normalizeString(body.residenceType),
    personType: normalizeString(body.personType),
    businessRegistrationNumber: normalizeString(
      body.businessRegistrationNumber,
    ),
    businessAddress: normalizeString(body.businessAddress),
    zipcode: normalizeString(body.zipcode),
    address: normalizeString(body.address),
    addressDetail: normalizeString(body.addressDetail),
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
    bankAccounts: sanitizeBankAccounts(body.bankAccounts),
  };
}

export function sanitizeOtherIncomeLaborEmployeePayload(
  body: OtherIncomeLaborEmployeeCreateBody,
): OtherIncomeLaborEmployeeCreateBody {
  return {
    employeeCode: normalizeString(body.employeeCode),
    name: normalizeString(body.name) ?? "",
    residentNumber: normalizeString(body.residentNumber),
    nationalityType: normalizeString(body.nationalityType),
    residenceType: normalizeString(body.residenceType),
    zipcode: normalizeString(body.zipcode),
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
    address: normalizeString(body.address),
    addressDetail: normalizeString(body.addressDetail),
    bankName: normalizeString(body.bankName),
    accountNumber: normalizeString(body.accountNumber),
    accountHolder: normalizeString(body.accountHolder),
    bankAccounts: sanitizeBankAccounts(body.bankAccounts, {
      bankName: normalizeString(body.bankName),
      accountNumber: normalizeString(body.accountNumber),
      accountHolder: normalizeString(body.accountHolder),
    }),
  };
}

export function isNonEmptyName(
  payload: NullableStringFields<{ name?: string | null }>,
) {
  return Boolean(payload.name?.trim());
}
