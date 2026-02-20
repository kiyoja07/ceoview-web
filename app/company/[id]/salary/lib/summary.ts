import type {
  BusinessApiResponse,
  DailyApiResponse,
  EarnedApiResponse,
  IncomeSummary,
  OtherApiResponse,
} from "../types";

export function buildEarnedSummary(
  data: EarnedApiResponse | null,
): IncomeSummary | null {
  if (!data?.rows.length) return null;

  return {
    totalPayment: data.rows.reduce((s, r) => s + Number(r.totalPayment), 0),
    totalDeduction: data.rows.reduce((s, r) => s + Number(r.totalDeduction), 0),
    netPayment: data.rows.reduce((s, r) => s + Number(r.netPayment), 0),
    count: data.total,
  };
}

export function buildBusinessSummary(
  data: BusinessApiResponse | null,
): IncomeSummary | null {
  if (!data?.rows.length) return null;

  const totalDeduction = data.rows.reduce(
    (s, r) =>
      s +
      Number(r.incomeTax) +
      Number(r.localIncomeTax) +
      Number(r.expenseArtSpec) +
      Number(r.employmentIns) +
      Number(r.studentLoan) +
      Number(r.industrialAcc),
    0,
  );

  return {
    totalPayment: data.rows.reduce((s, r) => s + Number(r.grossPayment), 0),
    totalDeduction,
    netPayment: data.rows.reduce((s, r) => s + Number(r.netPayment), 0),
    count: data.total,
  };
}

export function buildDailySummary(
  data: DailyApiResponse | null,
): IncomeSummary | null {
  if (!data?.rows.length) return null;

  const totalDeduction = data.rows.reduce(
    (s, r) =>
      s +
      Number(r.employmentIns) +
      Number(r.nationalPension) +
      Number(r.healthIns) +
      Number(r.incomeTax) +
      Number(r.localIncomeTax) +
      Number(r.longTermCare),
    0,
  );

  return {
    totalPayment: data.rows.reduce((s, r) => s + Number(r.grossPay), 0),
    totalDeduction,
    netPayment: data.rows.reduce((s, r) => s + Number(r.netPay), 0),
    count: data.total,
  };
}

export function buildOtherSummary(
  data: OtherApiResponse | null,
): IncomeSummary | null {
  if (!data?.rows.length) return null;

  const totalDeduction = data.rows.reduce(
    (s, r) => s + Number(r.taxCorpTax) + Number(r.localIncomeTax),
    0,
  );

  return {
    totalPayment: data.rows.reduce((s, r) => s + Number(r.grossPayment), 0),
    totalDeduction,
    netPayment: data.rows.reduce((s, r) => s + Number(r.netPayment), 0),
    count: data.total,
  };
}

export function buildGrandTotal(
  values: Array<IncomeSummary | null>,
): IncomeSummary | null {
  const valid = values.filter(Boolean) as IncomeSummary[];
  if (!valid.length) return null;

  return {
    totalPayment: valid.reduce((s, v) => s + v.totalPayment, 0),
    totalDeduction: valid.reduce((s, v) => s + v.totalDeduction, 0),
    netPayment: valid.reduce((s, v) => s + v.netPayment, 0),
    count: valid.reduce((s, v) => s + v.count, 0),
  };
}
