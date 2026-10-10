import type { PayslipData } from "@/app/lib/payslip/payslip-template";

/** POST /api/public/payslip/view 성공 응답 */
export type PayslipViewResponse = {
  payslipData: PayslipData;
  signupGrant: string | null;
  employeeAccountExists: boolean;
  employeeAccountActive: boolean;
  employeeLoginHint: string | null;
  signupContactHint: string | null;
  employeeSignupUnavailableReason: string | null;
};

/** POST /api/public/payslip/view 실패 응답 */
export type PayslipViewErrorResponse = {
  error: string;
};

/** GET /api/public/payslip/view?token= 응답. 토큰을 소진하지 않고 사용 가능 여부만 알려준다. */
export type PayslipTokenStatusResponse = {
  usable: boolean;
};
