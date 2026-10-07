import type { PayslipData } from "@/app/company/[id]/salary/lib/payslip-template";

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
