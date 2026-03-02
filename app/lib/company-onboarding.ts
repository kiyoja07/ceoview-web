export const COMPANY_ONBOARDING_PENDING_MARKER = "__ONBOARDING_PENDING__";

export function isCompanyProfileComplete(companyAddress: string | null) {
  return companyAddress !== COMPANY_ONBOARDING_PENDING_MARKER;
}

export function createPlaceholderBusinessNumber() {
  const random9 = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `9${random9}`;
}
