export function formatOrganizationPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  // Seoul: 02-xxxx-xxxx
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Other area / mobile: 0xx-xxxx-xxxx
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function validateOrganizationPhone(value: string): string | null {
  if (!value.trim()) return null;

  const digits = value.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) {
    return "올바른 대표 전화번호를 입력해주세요.";
  }

  return null;
}
