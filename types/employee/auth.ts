export type EmployeeAuthMessageState = {
  type: "error" | "success";
  text: string;
} | null;

export type EmployeeAuthResponse = {
  redirectTo?: string;
  message?: string;
  error?: string;
};

export type EmployeeAuthMeResponse = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  zipcode: string | null;
  address: string | null;
  addressDetail: string | null;
  isActive: boolean;
  employee: {
    id: string;
    employeeCode: string | null;
    department: string | null;
    positionTitle: string | null;
  };
  company: {
    id: string;
    businessName: string | null;
    businessNumber: string;
  };
};

export type EmployeeLoginBody = {
  contactType?: "email" | "phone";
  contact?: string;
  email?: string;
  phone?: string;
};

export type EmployeeSignupFromPayslipBody = {
  signupGrant?: string;
};
