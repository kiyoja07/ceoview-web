import type {
  CompanyInfoUpdateBody,
} from "@/types/company/users";
import type {
  EmployeeBankAccountBody,
  EmployeeCreateBody,
} from "@/types/company/employees";

export type CompanyChangeRequestScope = "EMPLOYEE" | "COMPANY_INFO";
export type CompanyChangeRequestAction = "CREATE" | "UPDATE" | "DELETE";
export type CompanyChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type EmployeeRequestPayload = EmployeeCreateBody;
export type CompanyInfoRequestPayload = CompanyInfoUpdateBody;

export type CompanyChangeRequestCompany = {
  id: string;
  businessNumber: string;
  businessName: string | null;
};

export type CompanyChangeRequestUser = {
  id: string;
  name: string;
  email?: string | null;
};

export type CompanyChangeRequestItem = {
  id: string;
  scope: CompanyChangeRequestScope;
  action: CompanyChangeRequestAction;
  status: CompanyChangeRequestStatus;
  companyId: string;
  targetEmployeeId: string | null;
  requestedPayload: EmployeeRequestPayload | CompanyInfoRequestPayload;
  currentSnapshot: EmployeeRequestPayload | CompanyInfoRequestPayload | null;
  resolutionComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: CompanyChangeRequestCompany;
  requestedByCompanyUser: CompanyChangeRequestUser;
  resolvedByAgentUser: CompanyChangeRequestUser | null;
};

export type CompanyChangeRequestListResponse = {
  items: CompanyChangeRequestItem[];
  total: number;
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
};

export type CompanyChangeRequestDetailResponse = {
  item: CompanyChangeRequestItem;
};

export type PendingRequestSummary = Pick<
  CompanyChangeRequestItem,
  | "id"
  | "scope"
  | "action"
  | "status"
  | "targetEmployeeId"
  | "requestedPayload"
  | "currentSnapshot"
  | "resolutionComment"
  | "resolvedAt"
  | "createdAt"
  | "updatedAt"
>;

export type CompanyMutationRequestResponse = {
  success: true;
  request: PendingRequestSummary;
  message: string;
};

export type CompanyChangeRequestRejectBody = {
  resolutionComment?: string;
};

export type EmployeeRequestBankAccount = EmployeeBankAccountBody;
