import type { CompanyInfoUpdateBody } from "@/types/company/users";
import type {
  EmployeeBankAccountBody,
  EmployeeCreateBody,
  BusinessIncomeEmployeeCreateBody,
  OtherIncomeEmployeeCreateBody,
  OtherIncomeLaborEmployeeCreateBody,
} from "@/types/company/employees";
import type {
  CompanyChangeRequestItem,
  CompanyChangeRequestScope,
  PendingRequestSummary,
} from "@/types/company/change-request";

type NullableStringFields<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K];
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toId(value: bigint | null | undefined) {
  return value ? value.toString() : null;
}

export function sanitizeEmployeeRequestPayload(
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

export function sanitizeCompanyInfoRequestPayload(
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
    zipcode: normalizeString(body.zipcode),
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
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
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
  };
}

export function sanitizeOtherIncomeLaborEmployeePayload(
  body: OtherIncomeLaborEmployeeCreateBody,
): OtherIncomeLaborEmployeeCreateBody {
  return {
    employeeCode: normalizeString(body.employeeCode),
    name: normalizeString(body.name) ?? "",
    residentNumber: normalizeString(body.residentNumber),
    department: normalizeString(body.department),
    positionTitle: normalizeString(body.positionTitle),
    email: normalizeString(body.email),
    phone: normalizeString(body.phone),
    hireDate: normalizeString(body.hireDate),
    resignDate: normalizeString(body.resignDate),
    address: normalizeString(body.address),
    bankName: normalizeString(body.bankName),
    accountNumber: normalizeString(body.accountNumber),
  };
}

export function snapshotEmployeeRecord(employee: {
  employeeCode: string | null;
  name: string;
  residentNumber: string | null;
  nationalityType: string | null;
  jobCategory: string | null;
  residenceType: string | null;
  department: string | null;
  positionTitle: string | null;
  email: string | null;
  phone: string | null;
  landlinePhone: string | null;
  hireDate: string | null;
  resignDate: string | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
  hasSpouse: string | null;
  dependentUnder20: string | null;
  dependentOver60: string | null;
  deductionSenior: string | null;
  deductionDisabled: string | null;
  deductionWomen: string | null;
  deductionChildren: string | null;
  deductionBirthAdoption: string | null;
  deductionSingleParent: string | null;
  employmentInsurance: string | null;
  payGrade: string | null;
  nationalPension: string | null;
  healthInsurance: string | null;
  bankAccounts?: Array<{
    id: bigint;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }>;
}): EmployeeCreateBody {
  return {
    employeeCode: employee.employeeCode,
    name: employee.name,
    residentNumber: employee.residentNumber,
    nationalityType: employee.nationalityType,
    jobCategory: employee.jobCategory,
    residenceType: employee.residenceType,
    department: employee.department,
    positionTitle: employee.positionTitle,
    email: employee.email,
    phone: employee.phone,
    landlinePhone: employee.landlinePhone,
    hireDate: employee.hireDate,
    resignDate: employee.resignDate,
    zipcode: employee.zipcode,
    address: employee.address,
    addressDetail: employee.addressDetail,
    hasSpouse: employee.hasSpouse,
    dependentUnder20: employee.dependentUnder20,
    dependentOver60: employee.dependentOver60,
    deductionSenior: employee.deductionSenior,
    deductionDisabled: employee.deductionDisabled,
    deductionWomen: employee.deductionWomen,
    deductionChildren: employee.deductionChildren,
    deductionBirthAdoption: employee.deductionBirthAdoption,
    deductionSingleParent: employee.deductionSingleParent,
    employmentInsurance: employee.employmentInsurance,
    payGrade: employee.payGrade,
    nationalPension: employee.nationalPension,
    healthInsurance: employee.healthInsurance,
    bankAccounts:
      employee.bankAccounts?.map((bankAccount) => ({
        id: bankAccount.id.toString(),
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
      })) ?? [],
  };
}

export function snapshotCompanyInfoRecord(company: {
  businessName: string | null;
  representativeName: string | null;
  openingDate: Date | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
}): CompanyInfoUpdateBody {
  return {
    businessName: company.businessName,
    representativeName: company.representativeName,
    openingDate: company.openingDate
      ? company.openingDate.toISOString().slice(0, 10)
      : null,
    zipcode: company.zipcode,
    address: company.address,
    addressDetail: company.addressDetail,
  };
}

export function serializePendingRequestSummary(request: {
  id: bigint;
  scope: string;
  action: string;
  status: string;
  targetEmployeeId: bigint | null;
  requestedPayload: unknown;
  currentSnapshot: unknown;
  resolutionComment: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PendingRequestSummary {
  return {
    id: request.id.toString(),
    scope: request.scope as PendingRequestSummary["scope"],
    action: request.action as PendingRequestSummary["action"],
    status: request.status as PendingRequestSummary["status"],
    targetEmployeeId: toId(request.targetEmployeeId),
    requestedPayload:
      request.requestedPayload as PendingRequestSummary["requestedPayload"],
    currentSnapshot:
      request.currentSnapshot as PendingRequestSummary["currentSnapshot"],
    resolutionComment: request.resolutionComment,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export function serializeCompanyChangeRequest(request: {
  id: bigint;
  scope: string;
  action: string;
  status: string;
  companyId: bigint;
  targetEmployeeId: bigint | null;
  requestedPayload: unknown;
  currentSnapshot: unknown;
  resolutionComment: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  company: {
    id: bigint;
    businessNumber: string;
    businessName: string | null;
  };
  requestedByCompanyUser: {
    id: bigint;
    name: string;
    email: string | null;
  };
  resolvedByAgentUser: {
    id: bigint;
    name: string;
    email: string | null;
  } | null;
}): CompanyChangeRequestItem {
  return {
    ...serializePendingRequestSummary(request),
    companyId: request.companyId.toString(),
    company: {
      id: request.company.id.toString(),
      businessNumber: request.company.businessNumber,
      businessName: request.company.businessName,
    },
    requestedByCompanyUser: {
      id: request.requestedByCompanyUser.id.toString(),
      name: request.requestedByCompanyUser.name,
      email: request.requestedByCompanyUser.email,
    },
    resolvedByAgentUser: request.resolvedByAgentUser
      ? {
          id: request.resolvedByAgentUser.id.toString(),
          name: request.resolvedByAgentUser.name,
          email: request.resolvedByAgentUser.email,
        }
      : null,
  };
}

export function getLatestPendingRequestByScope<
  T extends {
    scope: string;
    createdAt: string;
  },
>(requests: T[], scope: CompanyChangeRequestScope) {
  return requests.find((request) => request.scope === scope) ?? null;
}

export function isNonEmptyName(
  payload: NullableStringFields<{ name?: string | null }>,
) {
  return Boolean(payload.name?.trim());
}
