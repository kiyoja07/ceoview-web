import type { KeyLabel } from "@/catalogs/types";
import type {
  CompanyChangeRequestAction,
  CompanyChangeRequestItem,
  CompanyChangeRequestListResponse,
  CompanyChangeRequestScope,
  CompanyChangeRequestStatus,
} from "@/types/company/change-request";

export type ChangeRequestFilterKey = "ALL" | CompanyChangeRequestStatus;

export const CHANGE_REQUEST_SCOPE_LABELS: Record<
  CompanyChangeRequestScope,
  string
> = {
  EMPLOYEE: "직원",
  COMPANY_INFO: "회사 정보",
};

export const CHANGE_REQUEST_ACTION_LABELS: Record<
  CompanyChangeRequestAction,
  string
> = {
  CREATE: "등록",
  UPDATE: "수정",
  DELETE: "삭제",
};

export const CHANGE_REQUEST_STATUS_LABELS: Record<
  CompanyChangeRequestStatus,
  string
> = {
  PENDING: "접수중",
  APPROVED: "승인",
  REJECTED: "보류",
  CANCELLED: "취소",
};

export const CHANGE_REQUEST_STATUS_BADGE_CLASSES: Record<
  CompanyChangeRequestStatus,
  string
> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export const CHANGE_REQUEST_DETAIL_FIELD_LABELS: Array<KeyLabel<string>> = [
  { key: "employeeCode", label: "사원코드" },
  { key: "name", label: "이름" },
  { key: "residentNumber", label: "주민등록번호" },
  { key: "department", label: "부서" },
  { key: "positionTitle", label: "직책" },
  { key: "email", label: "이메일" },
  { key: "phone", label: "휴대폰" },
  { key: "hireDate", label: "입사일" },
  { key: "resignDate", label: "퇴사일" },
  { key: "zipcode", label: "우편번호" },
  { key: "address", label: "주소" },
  { key: "addressDetail", label: "상세주소" },
  { key: "businessName", label: "상호명" },
  { key: "representativeName", label: "대표자명" },
  { key: "openingDate", label: "개업일" },
  { key: "bankAccounts", label: "급여계좌" },
];

export const CHANGE_REQUEST_EMPLOYEE_FIELD_LABELS: Array<KeyLabel<string>> = [
  { key: "employeeCode", label: "사원코드" },
  { key: "name", label: "이름" },
  { key: "residentNumber", label: "주민등록번호" },
  { key: "department", label: "부서" },
  { key: "positionTitle", label: "직책" },
  { key: "email", label: "이메일" },
  { key: "phone", label: "휴대폰" },
  { key: "hireDate", label: "입사일" },
  { key: "resignDate", label: "퇴사일" },
  { key: "zipcode", label: "우편번호" },
  { key: "address", label: "주소" },
  { key: "addressDetail", label: "상세주소" },
];

export const CHANGE_REQUEST_EMPLOYEE_COMPARISON_FIELD_LABELS: Array<
  KeyLabel<string>
> = [
  ...CHANGE_REQUEST_EMPLOYEE_FIELD_LABELS,
  { key: "bankAccounts", label: "급여계좌" },
];

export const CHANGE_REQUEST_COPY = {
  companyList: {
    title: "요청 현황",
    description: "세무대리인에게 제출한 요청의 처리 상태를 확인합니다.",
    loading: "요청 현황을 불러오는 중...",
    empty: "등록된 요청이 없습니다.",
    loadError: "요청 현황을 불러오지 못했습니다.",
    back: "요청 현황으로",
  },
  agentList: {
    title: "요청함",
    description: "회사가 제출한 직원 및 회사 정보 변경 요청을 검수합니다.",
    loading: "요청함을 불러오는 중...",
    empty: "처리할 요청이 없습니다.",
    loadError: "요청함을 불러오지 못했습니다.",
  },
  detail: {
    title: "요청 상세",
    description: "제출한 변경 요청의 내용과 처리 상태를 확인합니다.",
    loading: "요청 상세를 불러오는 중...",
    loadError: "요청 상세를 불러오지 못했습니다.",
    cancel: "요청 취소",
    cancelConfirm: "요청을 취소하시겠습니까?",
    cancelling: "취소 중...",
    cancelError: "요청 취소에 실패했습니다.",
  },
} as const;

export function buildChangeRequestStatusFilterOptions(
  summary: CompanyChangeRequestListResponse["summary"],
): Array<KeyLabel<ChangeRequestFilterKey>> {
  return [
    { key: "ALL", label: `전체 ${summary.total}` },
    { key: "PENDING", label: `접수중 ${summary.pending}` },
    { key: "APPROVED", label: `승인 ${summary.approved}` },
    { key: "REJECTED", label: `보류 ${summary.rejected}` },
    { key: "CANCELLED", label: `취소 ${summary.cancelled}` },
  ];
}

export function getChangeRequestTitle(item: CompanyChangeRequestItem) {
  return `${CHANGE_REQUEST_SCOPE_LABELS[item.scope]} ${CHANGE_REQUEST_ACTION_LABELS[item.action]} 요청`;
}
