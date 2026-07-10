import * as XLSX from "xlsx";
import type { JournalLine } from "./types";
import { clean, cleanHeader, toAmount } from "./utils";

// 헤더 행 탐지에 사용할 위하고 분개장 표준 컬럼
const HEADER_MARKERS = [
  "일자",
  "전표번호",
  "계정코드",
  "계정과목",
  "차변",
  "대변",
  "구분",
];

type RawSheet = unknown[][];

function readRaw(worksheet: XLSX.WorkSheet): RawSheet {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as RawSheet;
}

// 상위 여러 행 중 표준 컬럼이 가장 많이 매칭되는 행을 헤더로 판단
function detectHeaderRow(raw: RawSheet): { headerRow: number; score: number } {
  let headerRow = -1;
  let score = 0;
  const limit = Math.min(raw.length, 20);
  for (let i = 0; i < limit; i++) {
    const cells = new Set((raw[i] ?? []).map(cleanHeader));
    const matched = HEADER_MARKERS.filter((m) => cells.has(m)).length;
    if (matched > score) {
      score = matched;
      headerRow = i;
    }
  }
  return { headerRow, score };
}

// 헤더 이전 행(회사명/기간 등)에서 회계연도(4자리)를 추출
function extractFiscalYear(raw: RawSheet, headerRow: number): number | null {
  const scan = (predicate: (s: string) => boolean): number | null => {
    for (let i = 0; i <= headerRow; i++) {
      for (const cell of raw[i] ?? []) {
        const s = String(cell ?? "");
        if (predicate(s)) {
          const m = s.match(/\d{4}/);
          if (m) return Number.parseInt(m[0], 10);
        }
      }
    }
    return null;
  };
  // "기 간 : 2025년 ..." 형태를 우선, 없으면 아무 4자리
  return scan((s) => s.includes("기") && /\d{4}/.test(s)) ?? scan(() => true);
}

/**
 * 위하고 분개장 시트를 파싱해 회계연도와 라인 목록을 반환한다.
 * (BunGaeJang 노트북 셀 3의 헤더/연도 처리를 견고한 헤더 탐지로 이식)
 */
export function parseJournalSheet(worksheet: XLSX.WorkSheet): {
  fiscalYear: number | null;
  lines: JournalLine[];
} {
  const raw = readRaw(worksheet);
  const { headerRow, score } = detectHeaderRow(raw);

  if (headerRow < 0 || score < 4) {
    throw new Error(
      "분개장 헤더를 찾을 수 없습니다. 위하고 분개장(엑셀) 원본인지 확인해주세요.",
    );
  }

  const fiscalYear = extractFiscalYear(raw, headerRow);
  const headers = (raw[headerRow] ?? []).map(cleanHeader);

  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    if (h && !(h in colIndex)) colIndex[h] = i;
  });

  const cellOf = (row: unknown[], name: string): unknown =>
    colIndex[name] != null ? row[colIndex[name]] : "";

  const lines: JournalLine[] = [];
  for (let r = headerRow + 1; r < raw.length; r++) {
    const row = raw[r] ?? [];
    const date = clean(cellOf(row, "일자"));
    if (!date) continue;

    const debit = toAmount(cellOf(row, "차변"));
    const credit = toAmount(cellOf(row, "대변"));

    // 구분 컬럼이 있으면 사용, 없으면 금액으로 차/대변 추론
    let side = clean(cellOf(row, "구분")) as JournalLine["side"];
    if (side !== "차변" && side !== "대변") {
      if (debit !== 0 && credit === 0) side = "차변";
      else if (credit !== 0 && debit === 0) side = "대변";
      else continue; // 합계/공백 행 스킵
    }

    lines.push({
      date,
      voucherNo: clean(cellOf(row, "전표번호")),
      accountCode: clean(cellOf(row, "계정코드")),
      accountName: clean(cellOf(row, "계정과목")),
      amount: side === "차변" ? debit : credit,
      side,
      partnerCode: clean(cellOf(row, "거래처코드")) || null,
      partnerName: clean(cellOf(row, "거래처명")) || null,
    });
  }

  return { fiscalYear, lines };
}
