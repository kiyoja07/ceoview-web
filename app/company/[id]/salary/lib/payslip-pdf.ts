import type {
  EarnedIncomeRow,
  BusinessIncomeRow,
  DailyIncomeLaborRow,
  OtherIncomeRow,
  Company,
  IncomeTab,
} from "../types";
import { formatNumber, formatYm, formatBusinessNumber } from "./format";

/* ───────── Types ───────── */

type IncomeRow =
  | EarnedIncomeRow
  | BusinessIncomeRow
  | DailyIncomeLaborRow
  | OtherIncomeRow;

interface PayslipItem {
  label: string;
  amount: number;
}

const INCOME_TYPE_LABELS: Record<IncomeTab, string> = {
  earned: "근로소득",
  business: "사업소득",
  daily: "일용직소득",
  other: "기타소득",
};

/* ───────── Data extraction ───────── */

function earnedPaymentItems(row: EarnedIncomeRow): PayslipItem[] {
  return [
    { label: "기본급", amount: Number(row.baseSalary) },
    { label: "상여", amount: Number(row.bonus) },
    { label: "식대", amount: Number(row.mealAllowance) },
    { label: "수당", amount: Number(row.allowance) },
    { label: "출장비", amount: Number(row.travelExpense) },
  ];
}
function earnedDeductionItems(row: EarnedIncomeRow): PayslipItem[] {
  return [
    { label: "국민연금", amount: Number(row.nationalPensionDeduction) },
    { label: "건강보험", amount: Number(row.healthInsurance) },
    { label: "장기요양보험", amount: Number(row.longTermCareInsurance) },
    { label: "고용보험", amount: Number(row.employmentInsurance) },
    { label: "근로소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
    ...(row.dynamicDeductionItems ?? []).map((item) => ({
      label: item.name,
      amount: Number(item.amount),
    })),
  ];
}
function businessPaymentItems(row: BusinessIncomeRow): PayslipItem[] {
  return [{ label: "지급액", amount: Number(row.grossPayment) }];
}
function businessDeductionItems(row: BusinessIncomeRow): PayslipItem[] {
  return [
    { label: "소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
    { label: "예술/특고인 경비", amount: Number(row.expenseArtSpec) },
    { label: "고용보험료", amount: Number(row.employmentIns) },
    { label: "학자금상환액", amount: Number(row.studentLoan) },
    { label: "산재보험료", amount: Number(row.industrialAcc) },
  ];
}
function dailyPaymentItems(row: DailyIncomeLaborRow): PayslipItem[] {
  return [{ label: "급여총액", amount: Number(row.grossPay) }];
}
function dailyDeductionItems(row: DailyIncomeLaborRow): PayslipItem[] {
  return [
    { label: "고용보험료", amount: Number(row.employmentIns) },
    { label: "국민연금", amount: Number(row.nationalPension) },
    { label: "건강보험료", amount: Number(row.healthIns) },
    { label: "장기요양보험", amount: Number(row.longTermCare) },
    { label: "소득세", amount: Number(row.incomeTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}
function otherPaymentItems(row: OtherIncomeRow): PayslipItem[] {
  return [{ label: "지급액", amount: Number(row.grossPayment) }];
}
function otherDeductionItems(row: OtherIncomeRow): PayslipItem[] {
  return [
    { label: "소득세/법인세", amount: Number(row.taxCorpTax) },
    { label: "지방소득세", amount: Number(row.localIncomeTax) },
  ];
}

function getPaymentItems(row: IncomeRow, type: IncomeTab): PayslipItem[] {
  switch (type) {
    case "earned":
      return earnedPaymentItems(row as EarnedIncomeRow);
    case "business":
      return businessPaymentItems(row as BusinessIncomeRow);
    case "daily":
      return dailyPaymentItems(row as DailyIncomeLaborRow);
    case "other":
      return otherPaymentItems(row as OtherIncomeRow);
  }
}

function getDeductionItems(row: IncomeRow, type: IncomeTab): PayslipItem[] {
  switch (type) {
    case "earned":
      return earnedDeductionItems(row as EarnedIncomeRow);
    case "business":
      return businessDeductionItems(row as BusinessIncomeRow);
    case "daily":
      return dailyDeductionItems(row as DailyIncomeLaborRow);
    case "other":
      return otherDeductionItems(row as OtherIncomeRow);
  }
}

function getTotalPayment(row: IncomeRow, type: IncomeTab): number {
  switch (type) {
    case "earned":
      return Number((row as EarnedIncomeRow).totalPayment);
    case "business":
      return Number((row as BusinessIncomeRow).grossPayment);
    case "daily":
      return Number((row as DailyIncomeLaborRow).grossPay);
    case "other":
      return Number((row as OtherIncomeRow).grossPayment);
  }
}

function getTotalDeduction(row: IncomeRow, type: IncomeTab): number {
  switch (type) {
    case "earned":
      return Number((row as EarnedIncomeRow).totalDeduction);
    case "business": {
      const b = row as BusinessIncomeRow;
      return (
        Number(b.incomeTax) +
        Number(b.localIncomeTax) +
        Number(b.expenseArtSpec) +
        Number(b.employmentIns) +
        Number(b.studentLoan) +
        Number(b.industrialAcc)
      );
    }
    case "daily": {
      const d = row as DailyIncomeLaborRow;
      return (
        Number(d.employmentIns) +
        Number(d.nationalPension) +
        Number(d.healthIns) +
        Number(d.longTermCare) +
        Number(d.incomeTax) +
        Number(d.localIncomeTax)
      );
    }
    case "other": {
      const o = row as OtherIncomeRow;
      return Number(o.taxCorpTax) + Number(o.localIncomeTax);
    }
  }
}

function getNetPayment(row: IncomeRow, type: IncomeTab): number {
  switch (type) {
    case "earned":
      return Number((row as EarnedIncomeRow).netPayment);
    case "business":
      return Number((row as BusinessIncomeRow).netPayment);
    case "daily":
      return Number((row as DailyIncomeLaborRow).netPay);
    case "other":
      return Number((row as OtherIncomeRow).netPayment);
  }
}

function getAccrualYm(row: IncomeRow, type: IncomeTab): string {
  if (type === "daily") return "—";
  return formatYm(
    (row as EarnedIncomeRow | BusinessIncomeRow | OtherIncomeRow).accrualYm,
  );
}

function getPaymentYm(row: IncomeRow, type: IncomeTab): string {
  if (type === "daily") return "—";
  return formatYm(
    (row as EarnedIncomeRow | BusinessIncomeRow | OtherIncomeRow).paymentYm,
  );
}

/* ───────── HTML generation ───────── */

function buildPayslipHtml(
  row: IncomeRow,
  incomeType: IncomeTab,
  company: Company | null,
): string {
  const paymentItems = getPaymentItems(row, incomeType);
  const deductionItems = getDeductionItems(row, incomeType);
  const totalPayment = getTotalPayment(row, incomeType);
  const totalDeduction = getTotalDeduction(row, incomeType);
  const netPayment = getNetPayment(row, incomeType);
  const maxRows = Math.max(paymentItems.length, deductionItems.length);

  const fmt = (n: number) => formatNumber(n);

  let extraRows = "";
  if (incomeType === "earned") {
    const earned = row as EarnedIncomeRow;
    extraRows += `<tr>
      <th>지급일</th>
      <td colspan="3">${new Date(earned.payDate).toLocaleDateString("ko-KR")}</td>
    </tr>`;
  }
  if (incomeType === "daily") {
    const d = row as DailyIncomeLaborRow;
    extraRows += `<tr>
      <th>근무일수</th><td>${d.workDays ?? "—"}일</td>
      <th>근무시간</th><td>정상 ${d.normalHours ?? "—"}h | 연장 ${d.overtimeHours ?? "—"}h</td>
    </tr>`;
  }

  const dept =
    incomeType === "earned"
      ? ((row as EarnedIncomeRow).department ?? "—")
      : "—";
  const pos =
    incomeType === "earned"
      ? ((row as EarnedIncomeRow).position ?? "—")
      : incomeType === "daily"
        ? ((row as DailyIncomeLaborRow).position ?? "—")
        : "—";

  const incomeTypeExtra =
    incomeType === "other"
      ? ` <span style="margin-left:8px;padding:2px 8px;background:#fef3c7;border-radius:9px;font-size:11px;color:#92400e">${(row as OtherIncomeRow).incomeType}</span>`
      : "";

  const payRows = Array.from({ length: maxRows })
    .map((_, i) => {
      const p = paymentItems[i];
      const d = deductionItems[i];
      return `<tr>
      <td>${p?.label ?? ""}</td>
      <td class="amount">${p ? fmt(p.amount) : ""}</td>
      <td>${d?.label ?? ""}</td>
      <td class="amount">${d ? fmt(d.amount) : ""}</td>
    </tr>`;
    })
    .join("");

  return `
<div class="payslip">
  <h2 class="title">급 여 명 세 서</h2>

  <table class="info">
    <tr>
      <th>회사명</th><td>${company?.businessName ?? "—"}</td>
      <th>사원명</th><td style="font-weight:600">${row.employeeName}</td>
    </tr>
    <tr>
      <th>사업자번호</th><td style="font-family:monospace;font-size:13px">${company ? formatBusinessNumber(company.businessNumber) : "—"}</td>
      <th>사원코드</th><td style="font-family:monospace;font-size:13px">${row.employeeCode}</td>
    </tr>
    <tr>
      <th>소득구분</th>
      <td><span style="padding:2px 8px;background:#eff6ff;border-radius:9px;font-size:11px;color:#1d4ed8">${INCOME_TYPE_LABELS[incomeType]}</span>${incomeTypeExtra}</td>
      <th>부서/직급</th><td>${dept}${pos !== "—" ? ` / ${pos}` : ""}</td>
    </tr>
    <tr>
      <th>귀속년월</th><td style="font-family:monospace">${getAccrualYm(row, incomeType)}</td>
      <th>지급년월</th><td style="font-family:monospace">${getPaymentYm(row, incomeType)}</td>
    </tr>
    ${extraRows}
  </table>

  <table class="detail">
    <thead>
      <tr>
        <th colspan="2" class="pay-header">지급 항목</th>
        <th colspan="2" class="ded-header">공제 항목</th>
      </tr>
      <tr>
        <th class="pay-sub">항목</th>
        <th class="pay-sub">금액</th>
        <th class="ded-sub">항목</th>
        <th class="ded-sub">금액</th>
      </tr>
    </thead>
    <tbody>
      ${payRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <th>지급액 계</th>
        <td class="amount" style="font-size:15px;font-weight:700;color:#1d4ed8">${fmt(totalPayment)}</td>
        <th>공제액 계</th>
        <td class="amount" style="font-size:15px;font-weight:700;color:#e11d48">${fmt(totalDeduction)}</td>
      </tr>
    </tfoot>
  </table>

  <table class="net">
    <tr>
      <th>실수령액 (차인지급액)</th>
      <td class="amount">₩ ${fmt(netPayment)}</td>
    </tr>
  </table>

  <p class="footer">본 명세서는 전산 처리된 자료를 기반으로 작성되었습니다.</p>
</div>`;
}

const PAYSLIP_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1a1a1a; background: white; }
  .payslip { width: 720px; padding: 40px; }
  .title { text-align: center; font-size: 24px; font-weight: 700; margin-bottom: 24px; letter-spacing: 12px; color: #111827; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; }
  .info th { background: #f9fafb; font-weight: 600; color: #374151; width: 100px; text-align: left; }
  .info td { color: #1f2937; }
  .detail .pay-header { background: #2563eb; color: white; font-weight: 600; text-align: center; font-size: 14px; padding: 10px; }
  .detail .ded-header { background: #e11d48; color: white; font-weight: 600; text-align: center; font-size: 14px; padding: 10px; }
  .detail .pay-sub { background: #eff6ff; color: #1e40af; font-size: 12px; font-weight: 600; text-align: center; }
  .detail .ded-sub { background: #fff1f2; color: #9f1239; font-size: 12px; font-weight: 600; text-align: center; }
  .detail td { color: #374151; }
  .total-row { background: #f9fafb; }
  .total-row th { text-align: center; font-weight: 600; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .net th { background: #ecfdf5; color: #065f46; font-weight: 700; font-size: 16px; text-align: center; border: 2px solid #6ee7b7; padding: 12px; width: 50%; }
  .net td { background: #ecfdf5; color: #047857; font-weight: 800; font-size: 20px; text-align: right; border: 2px solid #6ee7b7; padding: 12px; font-family: monospace; }
  .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px; }
`;

/* ───────── Public API ───────── */

export function getEmployeeFileName(
  row: IncomeRow,
  incomeType: IncomeTab,
): string {
  const name = row.employeeName;
  const code = row.employeeCode;
  const typeLabel = INCOME_TYPE_LABELS[incomeType];
  return `급여명세서_${typeLabel}_${name}_${code}.pdf`;
}

/**
 * Renders a single payslip to a PDF Blob using html2canvas + jspdf.
 * The HTML is rendered in a hidden offscreen container.
 */
export async function renderPayslipPdf(
  row: IncomeRow,
  incomeType: IncomeTab,
  company: Company | null,
): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  // Create offscreen container
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-1;background:white;";
  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = PAYSLIP_CSS;
  shadow.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildPayslipHtml(row, incomeType, company);
  shadow.appendChild(wrapper);

  document.body.appendChild(container);

  // Wait for fonts/layout
  await new Promise((r) => setTimeout(r, 100));

  const canvas = await html2canvas(wrapper, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: 720,
  });

  document.body.removeChild(container);

  const imgWidth = 210; // A4 mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    0,
    0,
    imgWidth,
    imgHeight,
    undefined,
    "FAST",
  );

  return pdf.output("blob");
}

/**
 * Generates PDFs for all rows and packages them into a ZIP Blob.
 */
export async function generatePayslipZip(
  rows: IncomeRow[],
  incomeType: IncomeTab,
  company: Company | null,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = zip.folder("급여명세서")!;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const blob = await renderPayslipPdf(row, incomeType, company);
    const fileName = getEmployeeFileName(row, incomeType);
    folder.file(fileName, blob);
    onProgress?.(i + 1, rows.length);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
