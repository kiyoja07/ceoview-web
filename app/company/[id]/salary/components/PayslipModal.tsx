"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { EarnedWithholdingReceiptTable } from "./EarnedWithholdingReceiptTable";
import type { EarnedIncomeRow, Company, IncomeTab } from "../types";
import { renderPayslipHtml } from "../lib/payslip-template";
import {
  toPayslipData,
  INCOME_TYPE_LABELS,
  type IncomeRow,
} from "../lib/payslip-template";
import { SendPayslipButton } from "./SendPayslipButton";

/* ───────── Types ───────── */

interface PayslipModalProps {
  row: IncomeRow;
  incomeType: IncomeTab;
  company: Company | null;
  companyId?: string;
  onClose: () => void;
  onSent?: () => void;
}

type EarnedDocumentView = "payslip" | "withholding";

/* ───────── Component ───────── */

export function PayslipModal({
  row,
  incomeType,
  company,
  companyId,
  onClose,
  onSent,
}: PayslipModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [earnedDocumentView, setEarnedDocumentView] =
    useState<EarnedDocumentView>("payslip");

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  const payslipData = toPayslipData(row, incomeType, company);
  const isEarnedWithholdingView =
    incomeType === "earned" && earnedDocumentView === "withholding";
  const documentTitle = isEarnedWithholdingView
    ? "근로소득원천징수영수증"
    : "급여명세서";

  const payslipHtml = renderPayslipHtml(payslipData);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle} - ${row.employeeName}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1a1a1a; padding: 20px; }
          </style>
        </head>
        <body>
          ${payslipHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="my-8 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
              {documentTitle}
            </span>
            <span className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
              {INCOME_TYPE_LABELS[incomeType]}
            </span>
            {/* {incomeType === "earned" && (
              <div className="ml-1 inline-flex rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-gray-200">
                <button
                  type="button"
                  onClick={() => setEarnedDocumentView("payslip")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    earnedDocumentView === "payslip"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  급여명세서
                </button>
                <button
                  type="button"
                  onClick={() => setEarnedDocumentView("withholding")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    earnedDocumentView === "withholding"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  원천징수영수증
                </button>
              </div>
            )} */}
          </div>
          <div className="flex items-center gap-2">
            {incomeType === "earned" && companyId && (
              <SendPayslipButton
                companyId={companyId}
                row={row as EarnedIncomeRow}
                onSent={onSent}
              />
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 active:scale-95"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z"
                />
              </svg>
              인쇄
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-gray-600 active:scale-95"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Payslip Card */}
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-gray-950/5">
          <div ref={printRef}>
            {isEarnedWithholdingView ? (
              <div className="p-8">
                {/* <EarnedWithholdingReceiptTable
                  row={row as EarnedIncomeRow}
                  company={company}
                /> */}
              </div>
            ) : (
              <div
                className="payslip p-8"
                dangerouslySetInnerHTML={{ __html: payslipHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
