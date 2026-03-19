export type EmployeeContactType = "email" | "phone";

export function normalizeEmployeePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidEmployeePhone(value: string) {
  return /^01[016789]\d{7,8}$/.test(normalizeEmployeePhone(value));
}

export function formatEmployeePhone(value: string) {
  const digits = normalizeEmployeePhone(value);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return value;
}
