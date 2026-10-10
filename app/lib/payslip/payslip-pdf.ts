import type { Company, IncomeTab } from "@/types/company/salary";
import { PAYSLIP_INCOME_TAB_LABELS } from "@/catalogs/ko/salary";
import {
  renderPayslipHtml,
  toPayslipData,
  type PayslipData,
  type IncomeRow,
} from "@/app/lib/payslip/payslip-template";

const PAYSLIP_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1a1a1a; background: white; }
`;

/* ───────── Public API ───────── */

export function getEmployeeFileName(
  row: IncomeRow,
  incomeType: IncomeTab,
): string {
  return getPayslipFileName({
    employeeName: row.employeeName,
    employeeCode: row.employeeCode,
    incomeTypeLabel: PAYSLIP_INCOME_TAB_LABELS[incomeType],
  });
}

export function getPayslipFileName({
  employeeName,
  employeeCode,
  incomeTypeLabel,
}: Pick<PayslipData, "employeeName" | "employeeCode" | "incomeTypeLabel">) {
  return `급여명세서_${incomeTypeLabel}_${employeeName}_${employeeCode}.pdf`;
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
  return renderPayslipPdfFromData(toPayslipData(row, incomeType, company));
}

export async function renderPayslipPdfFromData(
  payslipData: PayslipData,
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
  wrapper.style.cssText = "width:720px;padding:40px;";
  wrapper.innerHTML = renderPayslipHtml(payslipData);
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
