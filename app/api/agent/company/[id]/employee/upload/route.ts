import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import { parseEmployeeRegistration } from "@/app/api/agent/employee/upload/parser";

async function requireAgentOrganizationId(request: NextRequest) {
  const userId = getAgentUserIdFromRequest(request);
  if (!userId) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  const user = await prisma.agentUser.findUnique({
    where: { id: userId },
    select: { isActive: true, agentOrganizationId: true },
  });

  if (!user || !user.isActive) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  if (!user.agentOrganizationId) {
    return {
      error: "소속 에이전트 조직 등록이 필요합니다.",
      status: 403,
    } as const;
  }

  return { userId, organizationId: user.agentOrganizationId } as const;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function toDateStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }
  const cleaned = s.replace(/[./]/g, "-");
  const match = cleaned.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return null;
}

// POST: 직원 엑셀 업로드 (미리보기 + 저장)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    let companyId: string;
    try {
      companyId = id;
    } catch {
      return NextResponse.json(
        { error: "유효한 거래처 ID가 아닙니다." },
        { status: 400 },
      );
    }

    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId,
        },
      },
      select: { companyId: true },
    });

    if (!companyLink) {
      return NextResponse.json(
        { error: "접근 권한이 없는 사업자입니다." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const save = formData.get("save") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "엑셀 파일을 첨부해주세요." },
        { status: 400 },
      );
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      return NextResponse.json(
        { error: "엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: false,
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: "엑셀 파일에 시트가 없습니다." },
        { status: 400 },
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const { columns, rows } = parseEmployeeRegistration(worksheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "엑셀 파일에 직원 데이터가 없습니다." },
        { status: 400 },
      );
    }

    if (!columns.includes("사원코드")) {
      return NextResponse.json(
        {
          error: `사원코드 컬럼을 찾을 수 없습니다.\n(감지된 컬럼: ${columns.join(", ")})`,
        },
        { status: 400 },
      );
    }

    // 급여 데이터에서 사원코드 목록 조회
    const salaryEmployeeCodes = await prisma.earnedIncome.findMany({
      where: { upload: { companyId } },
      select: { employeeCode: true, employeeName: true },
      distinct: ["employeeCode"],
    });

    const salaryCodeSet = new Set(
      salaryEmployeeCodes.map((r) => r.employeeCode),
    );
    const salaryCodeNameMap = new Map(
      salaryEmployeeCodes.map((r) => [r.employeeCode, r.employeeName]),
    );

    // 기존 직원 테이블에서 사원코드 목록 조회
    const existingEmployees = await prisma.employee.findMany({
      where: {
        companyId,
        deletedAt: null,
        employeeCode: { not: null },
      },
      select: { employeeCode: true },
    });
    const existingCodeSet = new Set(
      existingEmployees.map((e) => e.employeeCode),
    );

    const mappedRows: Record<string, unknown>[] = rows.map((row) => {
      const code = String(row["사원코드"] ?? "").trim();
      return {
        ...row,
        _employeeCode: code,
        _hasSalaryMatch: salaryCodeSet.has(code),
        _salaryEmployeeName: salaryCodeNameMap.get(code) ?? null,
        _alreadyRegistered: existingCodeSet.has(code),
      };
    });

    const matchedCount = mappedRows.filter((r) => r._hasSalaryMatch).length;
    const unmatchedCount = mappedRows.filter((r) => !r._hasSalaryMatch).length;
    const alreadyRegisteredCount = mappedRows.filter(
      (r) => r._alreadyRegistered,
    ).length;

    if (save) {
      let savedCount = 0;
      let skippedCount = 0;

      for (const row of mappedRows) {
        const code = String(row._employeeCode ?? "").trim();
        if (!code) continue;

        const name = toStr(row["사원명"]) ?? "";
        if (!name) continue;

        const residentNumber = toStr(row["주민(외국인)등록번호"]);
        const hireDate = toDateStr(row["입사일자"]);
        const resignDate = toDateStr(row["퇴사일자"]);
        const nationalityType = toStr(row["내외국인구분"]);
        const jobCategory = toStr(row["직종"]);
        const residenceType = toStr(row["거주구분"]);
        const department = toStr(row["부서"]);
        const positionTitle = toStr(row["직급"]);
        const hasSpouse = toStr(row["배우자유무"]);
        const dependentUnder20 = toStr(row["20세이하"]);
        const dependentOver60 = toStr(row["60세이상"]);
        const deductionSenior = toStr(row["경로우대"]);
        const deductionDisabled = toStr(row["장애인"]);
        const deductionWomen = toStr(row["부녀자"]);
        const deductionChildren = null;
        const deductionBirthAdoption = null;
        const deductionSingleParent = null;
        const employmentInsurance = toStr(row["고용보험적용여부"]);
        const payGrade = toStr(row["호봉"]);
        const nationalPension = toStr(row["국민연금료"]);
        const healthInsurance = toStr(row["건강보험료"]);
        const zipcode = toStr(row["우편번호"]);
        const address = toStr(row["주소"]);
        const addressDetail = null;
        const phone = toStr(row["전화번호"]);
        const mobile = toStr(row["휴대폰번호"]);
        const email = toStr(row["이메일"]);
        const bankName = toStr(row["급여이체은행"]);
        const accountNumber = toStr(row["계좌번호"]);
        const accountHolder = toStr(row["예금주"]);

        // 사원코드는 비어 있을 수 있어 고유 제약 대신 조회 후 수정/생성한다.
        const existingByCode = await prisma.employee.findFirst({
          where: { companyId, employeeCode: code },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        const employee = existingByCode
          ? await prisma.employee.update({
              where: { id: existingByCode.id },
              data: {
                name,
                residentNumber,
                nationalityType,
                jobCategory,
                residenceType,
                department,
                positionTitle,
                hireDate,
                resignDate,
                zipcode,
                address,
                addressDetail,
                phone: mobile ?? phone,
                landlinePhone: phone,
                email,
                hasSpouse,
                dependentUnder20,
                dependentOver60,
                deductionSenior,
                deductionDisabled,
                deductionWomen,
                deductionChildren,
                deductionBirthAdoption,
                deductionSingleParent,
                employmentInsurance,
                payGrade,
                nationalPension,
                healthInsurance,
                deletedAt: null,
              },
            })
          : await prisma.employee.create({
              data: {
                companyId,
                employeeCode: code,
                name,
                residentNumber,
                nationalityType,
                jobCategory,
                residenceType,
                department,
                positionTitle,
                hireDate,
                resignDate,
                zipcode,
                address,
                addressDetail,
                phone: mobile ?? phone,
                landlinePhone: phone,
                email,
                hasSpouse,
                dependentUnder20,
                dependentOver60,
                deductionSenior,
                deductionDisabled,
                deductionWomen,
                deductionChildren,
                deductionBirthAdoption,
                deductionSingleParent,
                employmentInsurance,
                payGrade,
                nationalPension,
                healthInsurance,
              },
            });

        if (bankName && accountNumber) {
          const existingAccounts = await prisma.employeeBankAccount.findMany({
            where: { employeeId: employee.id, deletedAt: null },
          });

          const alreadyExists = existingAccounts.some(
            (ba) =>
              ba.bankName === bankName && ba.accountNumber === accountNumber,
          );

          if (!alreadyExists) {
            await prisma.employeeBankAccount.create({
              data: {
                employeeId: employee.id,
                bankName,
                accountNumber,
                accountHolder: accountHolder ?? name,
              },
            });
          }
        }

        savedCount++;
      }

      skippedCount = mappedRows.length - savedCount;

      return NextResponse.json({
        success: true,
        saved: true,
        savedCount,
        skippedCount,
        fileName,
        sheetName,
        companyId: id,
        totalRows: rows.length,
        matchedCount,
        unmatchedCount,
        alreadyRegisteredCount,
        columns,
        rows: mappedRows.slice(0, 100),
      });
    }

    return NextResponse.json({
      success: true,
      saved: false,
      fileName,
      sheetName,
      companyId: id,
      totalRows: rows.length,
      matchedCount,
      unmatchedCount,
      alreadyRegisteredCount,
      columns,
      rows: mappedRows,
    });
  } catch (error) {
    console.error("Agent company employee upload error:", error);
    return NextResponse.json(
      { error: "직원 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
