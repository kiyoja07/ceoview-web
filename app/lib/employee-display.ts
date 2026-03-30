export function display(value: string | null | undefined): string {
  return value?.trim() || "-";
}

export function displayYesNo(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "-";
  if (trimmed === "0") return "해당안됨";
  if (trimmed === "1") return "해당함";
  return trimmed;
}

export function displayInsurance(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "-";
  if (trimmed === "0" || trimmed === "부") return "해당안됨";
  if (trimmed === "1" || trimmed === "여") return "가입";
  return trimmed;
}

export function getStatusColor(status: string | null): string {
  switch (status) {
    case "재직중":
      return "text-emerald-600 bg-emerald-50";
    case "입사예정":
      return "text-blue-600 bg-blue-50";
    case "퇴사완료":
      return "text-gray-500 bg-gray-100";
    case "퇴사예정":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-400 bg-gray-50";
  }
}
