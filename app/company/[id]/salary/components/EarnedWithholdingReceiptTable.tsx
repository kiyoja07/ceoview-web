import type { CSSProperties } from "react";
import type { Company, EarnedIncomeRow } from "../types";
import { formatBusinessNumber, formatNumber } from "../lib/format";

interface EarnedWithholdingReceiptTableProps {
  row: EarnedIncomeRow;
  company: Company | null;
}

/* ── Shared Styles ── */

const B = "1px solid #222";

const cell: CSSProperties = {
  border: B,
  padding: "2px 4px",
  fontSize: "10px",
  lineHeight: 1.4,
  verticalAlign: "middle",
};

const hd: CSSProperties = {
  ...cell,
  backgroundColor: "#f5f5f5",
  fontWeight: 600,
  textAlign: "center",
};

const numC: CSSProperties = {
  ...cell,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const vLabel: CSSProperties = {
  ...hd,
  writingMode: "vertical-rl",
  textOrientation: "upright",
  letterSpacing: "2px",
  width: "24px",
  minWidth: "24px",
  padding: "6px 2px",
  fontSize: "10px",
};

const tbl: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

/** Show empty string for 0 */
function fmt(v: string | number): string {
  const n = Number(v);
  if (n === 0 || Number.isNaN(n)) return "";
  return formatNumber(n);
}

export function EarnedWithholdingReceiptTable({
  row,
  company,
}: EarnedWithholdingReceiptTableProps) {
  const businessNo = company
    ? formatBusinessNumber(company.businessNumber)
    : "";
  const companyName = company?.businessName ?? "";
  const issueDate = new Date(row.payDate);

  const baseSalary = Number(row.baseSalary);
  const bonus = Number(row.bonus);
  const totalPayment = Number(row.totalPayment);
  const mealAllowance = Number(row.mealAllowance);
  const travelExpense = Number(row.travelExpense);
  const nonTaxableTotal = mealAllowance + travelExpense;

  const incomeTax = Number(row.incomeTax);
  const localIncomeTax = Number(row.localIncomeTax);

  const healthIns = Number(row.healthInsurance);
  const employmentIns = Number(row.employmentInsurance);
  const nationalPension = Number(row.nationalPensionDeduction);

  const accrualYmStr = String(row.accrualYm);
  const paymentYmStr = String(row.paymentYm);
  const workStart = `${accrualYmStr.slice(0, 4)}.${accrualYmStr.slice(4)}.01`;
  const workEnd = `${paymentYmStr.slice(0, 4)}.${paymentYmStr.slice(4)}.${String(issueDate.getDate()).padStart(2, "0")}`;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "780px",
        margin: "0 auto",
        color: "#000",
        fontFamily: "'Malgun Gothic', '맑은 고딕', sans-serif",
      }}
    >
      {/* ═══ Header reference line ═══ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          marginBottom: "4px",
          color: "#333",
        }}
      >
        <span>소득세법 시행규칙 [별지 제24호 서식(1)]</span>
        <span>(8쪽 중 제1쪽)</span>
      </div>

      {/* ═══ Title Block ═══ */}
      <table style={{ ...tbl, marginBottom: "0px" }}>
        <tbody>
          <tr>
            {/* Left: Titles */}
            <td
              style={{
                border: B,
                width: "56%",
                verticalAlign: "top",
                padding: "12px 16px",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                    marginBottom: "4px",
                  }}
                >
                  [ ✓ ] 근로소득 원천징수영수증
                </div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                  }}
                >
                  [&nbsp;&nbsp;&nbsp;] 근로소득 지급명세서
                </div>
              </div>
              <div
                style={{
                  border: B,
                  padding: "3px 8px",
                  margin: "8px 30px",
                  textAlign: "center",
                  fontSize: "10px",
                }}
              >
                관리번호
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "9px",
                  marginTop: "8px",
                }}
              >
                ( [ ✓ ] 소득자 보관용&nbsp;&nbsp;[&nbsp;&nbsp;] 발행자
                보관용&nbsp;&nbsp;[&nbsp;&nbsp;] 발행자 보고용 )
              </div>
            </td>

            {/* Right: Attributes */}
            <td
              style={{
                border: B,
                width: "44%",
                verticalAlign: "top",
                padding: 0,
              }}
            >
              <table style={{ ...tbl, fontSize: "9px" }}>
                <tbody>
                  {(
                    [
                      ["거주구분", "거주자① 비거주자②"],
                      ["거주지국코드", ""],
                      ["내·외국인", "내국인① 외국인②"],
                      ["외국인단일세율적용", "예1 / 부2"],
                      ["외국인감면", "예1 / 부2"],
                      ["종교관련종사자 여부", "예1 / 부2"],
                      ["국적", ""],
                      ["세대주 여부", "세대주1 세대원2"],
                      ["연말정산 구분", ""],
                    ] as const
                  ).map(([label, value], i) => (
                    <tr key={i}>
                      <td
                        style={{
                          ...cell,
                          fontSize: "9px",
                          backgroundColor: "#fafafa",
                          width: "52%",
                          borderTop: i === 0 ? "none" : B,
                          borderLeft: "none",
                          borderRight: B,
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          ...cell,
                          fontSize: "9px",
                          borderTop: i === 0 ? "none" : B,
                          borderRight: "none",
                        }}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══ 징수의무자 ═══ */}
      <table style={tbl}>
        <tbody>
          <tr>
            <td
              rowSpan={4}
              style={{
                ...hd,
                width: "58px",
                writingMode: "vertical-rl",
                textOrientation: "upright",
                letterSpacing: "3px",
                fontSize: "10px",
                padding: "6px 2px",
              }}
            >
              징수의무자
            </td>
            <td style={{ ...cell, width: "16%", fontSize: "9px" }}>
              ①법인명(상호)
            </td>
            <td style={{ ...cell, width: "22%" }}>{companyName}</td>
            <td style={{ ...cell, width: "16%", fontSize: "9px" }}>
              ②대표자(성 명)
            </td>
            <td style={cell}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>③사업자등록번호</td>
            <td style={cell}>{businessNo}</td>
            <td style={{ ...cell, fontSize: "9px" }}>④주민등록번호</td>
            <td style={cell}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>
              ③-1 사업자단위과세자 여부
            </td>
            <td style={cell}>예1 / 부2</td>
            <td style={{ ...cell, fontSize: "9px" }}>③-2 종사업장일련번호</td>
            <td style={cell}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑤소재지(주소)</td>
            <td colSpan={3} style={cell}></td>
          </tr>
        </tbody>
      </table>

      {/* ═══ 소득자 ═══ */}
      <table style={tbl}>
        <tbody>
          <tr>
            <td
              rowSpan={2}
              style={{
                ...hd,
                width: "58px",
                writingMode: "vertical-rl",
                textOrientation: "upright",
                letterSpacing: "6px",
                fontSize: "10px",
                padding: "6px 2px",
              }}
            >
              소득자
            </td>
            <td style={{ ...cell, width: "16%", fontSize: "9px" }}>
              ⑥성&nbsp;&nbsp;&nbsp;명
            </td>
            <td style={{ ...cell, width: "22%" }}>{row.employeeName}</td>
            <td style={{ ...cell, width: "16%", fontSize: "9px" }}>
              ⑦주민(외국인)등록번호
            </td>
            <td style={cell}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>
              ⑧주&nbsp;&nbsp;&nbsp;소
            </td>
            <td colSpan={3} style={cell}></td>
          </tr>
        </tbody>
      </table>

      {/* ═══ Section Ⅰ — 근무처별 소득명세 ═══ */}
      <table style={tbl}>
        <tbody>
          {/* Column headers */}
          <tr>
            <td
              rowSpan={14}
              style={{
                ...vLabel,
                fontSize: "10px",
                letterSpacing: "1px",
                lineHeight: 1.6,
              }}
            >
              Ⅰ근무처별소득명세
            </td>
            <td style={{ ...hd, width: "18%" }}>구분</td>
            <td style={{ ...hd, width: "18%" }}>주(현)</td>
            <td style={{ ...hd, width: "13%" }}>종(전)</td>
            <td style={{ ...hd, width: "13%" }}>종(전)</td>
            <td style={{ ...hd, width: "13%" }}>⑯-1 납세조합</td>
            <td style={{ ...hd, width: "13%" }}>합계</td>
          </tr>

          {/* ⑨ 근무처명 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑨ 근 무 처 명</td>
            <td style={cell}>{companyName}</td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
          </tr>

          {/* ⑩ 사업자등록번호 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑩ 사업자등록번호</td>
            <td style={cell}>{businessNo}</td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
          </tr>

          {/* ⑪ 근무기간 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑪ 근 무 기 간</td>
            <td style={cell}>
              {workStart} ~ {workEnd}
            </td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
          </tr>

          {/* ⑫ 감면기간 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑫ 감 면 기 간</td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
            <td style={cell}></td>
          </tr>

          {/* ⑬ 급여 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑬ 급&nbsp;&nbsp;여</td>
            <td style={numC}>{fmt(baseSalary)}</td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}>{fmt(baseSalary)}</td>
          </tr>

          {/* ⑭ 상여 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑭ 상&nbsp;&nbsp;여</td>
            <td style={numC}>{fmt(bonus)}</td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}>{fmt(bonus)}</td>
          </tr>

          {/* ⑮ 인정상여 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>⑮ 인 정 상 여</td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>

          {/* 소득명세 sub-items */}
          <tr>
            <td style={{ ...cell, fontSize: "8px", paddingLeft: "8px" }}>
              ⑯-1 주식매수선택권행사이익
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "8px", paddingLeft: "8px" }}>
              ⑯-2 우리사주조합인출금
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "8px", paddingLeft: "8px" }}>
              ⑰-1 임원퇴직소득금액 한도초과액
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: "8px", paddingLeft: "8px" }}>
              ⑰-2 직무발명보상금
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>

          {/* ⑱ 계 */}
          <tr>
            <td style={{ ...hd, fontSize: "10px" }}>⑱ 계</td>
            <td style={{ ...numC, fontWeight: 700 }}>{fmt(totalPayment)}</td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={{ ...numC, fontWeight: 700 }}>{fmt(totalPayment)}</td>
          </tr>
        </tbody>
      </table>

      {/* ═══ Section Ⅱ — 비과세소득 및 감면소득 명세 ═══ */}
      <table style={tbl}>
        <tbody>
          {/* Column headers */}
          <tr>
            <td
              rowSpan={8}
              style={{
                ...vLabel,
                fontSize: "9px",
                letterSpacing: "1px",
                lineHeight: 1.5,
              }}
            >
              Ⅱ비과세및감면소득명세
            </td>
            <td style={{ ...hd, width: "18%" }}>구분</td>
            <td style={{ ...hd, width: "18%" }}>주(현)</td>
            <td style={{ ...hd, width: "13%" }}>종(전)</td>
            <td style={{ ...hd, width: "13%" }}>종(전)</td>
            <td style={{ ...hd, width: "13%" }}>납세조합</td>
            <td style={{ ...hd, width: "13%" }}>합계</td>
          </tr>

          {/* Non-taxable income rows */}
          {mealAllowance > 0 && (
            <tr>
              <td style={{ ...cell, fontSize: "9px" }}>식대 (비과세)</td>
              <td style={numC}>{fmt(mealAllowance)}</td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}>{fmt(mealAllowance)}</td>
            </tr>
          )}
          {travelExpense > 0 && (
            <tr>
              <td style={{ ...cell, fontSize: "9px" }}>출장비 (비과세)</td>
              <td style={numC}>{fmt(travelExpense)}</td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}>{fmt(travelExpense)}</td>
            </tr>
          )}

          {/* Empty rows to maintain form structure */}
          {Array.from({
            length: Math.max(
              0,
              4 - (mealAllowance > 0 ? 1 : 0) - (travelExpense > 0 ? 1 : 0),
            ),
          }).map((_, i) => (
            <tr key={`empty-ii-${i}`}>
              <td style={cell}>&nbsp;</td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}></td>
              <td style={numC}></td>
            </tr>
          ))}

          {/* ⑲ 비과세소득계 */}
          <tr>
            <td style={{ ...hd, fontSize: "9px", textAlign: "left" }}>
              ⑲ 비과세소득계
            </td>
            <td style={{ ...numC, fontWeight: 600 }}>{fmt(nonTaxableTotal)}</td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={{ ...numC, fontWeight: 600 }}>{fmt(nonTaxableTotal)}</td>
          </tr>

          {/* ⑲-1 감면소득계 */}
          <tr>
            <td style={{ ...hd, fontSize: "9px", textAlign: "left" }}>
              ⑲-1 감면소득계
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>
        </tbody>
      </table>

      {/* ═══ Section Ⅲ — 세액명세 ═══ */}
      <table style={tbl}>
        <tbody>
          {/* Header */}
          <tr>
            <td
              rowSpan={7}
              style={{
                ...vLabel,
                fontSize: "10px",
                letterSpacing: "2px",
                lineHeight: 1.6,
              }}
            >
              Ⅲ세액명세
            </td>
            <td colSpan={2} style={{ ...hd, width: "36%" }}>
              구&nbsp;&nbsp;분
            </td>
            <td style={{ ...hd, width: "18%" }}>⑳소득세</td>
            <td style={{ ...hd, width: "18%" }}>㉑지방소득세</td>
            <td style={{ ...hd, width: "18%" }}>㉒농어촌특별세</td>
          </tr>

          {/* ㉓ 결정세액 */}
          <tr>
            <td colSpan={2} style={{ ...cell, fontSize: "9px" }}>
              ㉓ 결정세액
            </td>
            <td style={{ ...numC, fontWeight: 600 }}>{fmt(incomeTax)}</td>
            <td style={{ ...numC, fontWeight: 600 }}>{fmt(localIncomeTax)}</td>
            <td style={numC}></td>
          </tr>

          {/* ㉔ 종(전) 근무지 */}
          <tr>
            <td
              rowSpan={2}
              style={{
                ...cell,
                fontSize: "9px",
                verticalAlign: "middle",
                textAlign: "center",
                width: "8%",
              }}
            >
              ㉔
            </td>
            <td style={{ ...cell, fontSize: "9px" }}>
              종(전) 근무지
              <br />
              <span style={{ fontSize: "8px", color: "#666" }}>
                (결정세액의 해당 부분입니다)
              </span>
            </td>
            <td style={numC}>
              <span style={{ fontSize: "8px", color: "#888" }}>
                사업자등록번호
              </span>
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>

          {/* ㉕ 주(현) 근무지 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>㉕ 주(현) 근무지</td>
            <td style={numC}>{fmt(incomeTax)}</td>
            <td style={numC}>{fmt(localIncomeTax)}</td>
            <td style={numC}></td>
          </tr>

          {/* ㉖ 납부특례세액 */}
          <tr>
            <td colSpan={2} style={{ ...cell, fontSize: "9px" }}>
              ㉖ 납부특례세액
            </td>
            <td style={numC}></td>
            <td style={numC}></td>
            <td style={numC}></td>
          </tr>

          {/* ㉗ 차감징수세액 */}
          <tr>
            <td
              colSpan={2}
              style={{ ...hd, fontSize: "9px", textAlign: "left" }}
            >
              ㉗ 차감징수세액 (㉓-㉔-㉕-㉖)
            </td>
            <td style={{ ...numC, fontWeight: 700 }}>{fmt(incomeTax)}</td>
            <td style={{ ...numC, fontWeight: 700 }}>{fmt(localIncomeTax)}</td>
            <td style={numC}></td>
          </tr>
        </tbody>
      </table>

      {/* ═══ Bottom — Insurance & Certification ═══ */}
      <table style={{ ...tbl, marginTop: "0px" }}>
        <tbody>
          {/* 건강보험 */}
          <tr>
            <td style={{ ...cell, width: "24%", fontSize: "9px" }}>
              건강보험(총액/현근무지)
            </td>
            <td style={{ ...numC, width: "12%" }}>{fmt(healthIns)}</td>
            <td
              style={{
                ...cell,
                width: "2%",
                textAlign: "center",
                fontSize: "9px",
              }}
            >
              /
            </td>
            <td style={{ ...numC, width: "12%" }}>{fmt(healthIns)}</td>
            <td
              rowSpan={2}
              style={{
                ...cell,
                textAlign: "center",
                fontSize: "10px",
                verticalAlign: "middle",
              }}
            >
              위의 원천징수액(근로소득)을 정히 영수(지급) 합니다.
            </td>
          </tr>
          {/* 고용보험 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>
              고용보험(총액/현근무지)
            </td>
            <td style={numC}>{fmt(employmentIns)}</td>
            <td style={{ ...cell, textAlign: "center", fontSize: "9px" }}>/</td>
            <td style={numC}>{fmt(employmentIns)}</td>
          </tr>
          {/* 국민연금 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>
              국민연금(총액/현근무지)
            </td>
            <td style={numC}>{fmt(nationalPension)}</td>
            <td style={{ ...cell, textAlign: "center", fontSize: "9px" }}>/</td>
            <td style={numC}>{fmt(nationalPension)}</td>
            <td
              style={{
                ...cell,
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              {issueDate.getFullYear()}년{" "}
              {String(issueDate.getMonth() + 1).padStart(2, "0")}월{" "}
              {String(issueDate.getDate()).padStart(2, "0")}일
            </td>
          </tr>
          {/* 퇴직연금 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>
              퇴직연금(총액/현근무지)
            </td>
            <td style={numC}></td>
            <td style={{ ...cell, textAlign: "center", fontSize: "9px" }}>/</td>
            <td style={numC}></td>
            <td
              style={{
                ...cell,
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              징수(보고)의무자&nbsp;&nbsp;&nbsp;{companyName}
            </td>
          </tr>
          {/* 기타연금 */}
          <tr>
            <td style={{ ...cell, fontSize: "9px" }}>
              기타연금(총액/현근무지)
            </td>
            <td style={numC}></td>
            <td style={{ ...cell, textAlign: "center", fontSize: "9px" }}>/</td>
            <td style={numC}></td>
            <td
              style={{
                ...cell,
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              {row.employeeName}&nbsp;&nbsp;귀하
            </td>
          </tr>
        </tbody>
      </table>

      {/* Page size note */}
      <div
        style={{
          textAlign: "center",
          fontSize: "8px",
          color: "#666",
          marginTop: "4px",
        }}
      >
        210mm×297mm [백상지 80g/㎡ 또는 중질지 80g/㎡]
      </div>
    </div>
  );
}
