import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/app/lib/prisma";
import { getAgentUserIdFromRequest } from "@/app/lib/agent-auth";
import {
  parseEmployeeRegistration,
  parseBusinessIncomeEmployeeRegistration,
  parseOtherIncomeEmployeeRegistration,
  parseDailyLaborEmployeeRegistration,
} from "./parser";
import type { IncomeType } from "@/types/agent/employee";

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
  // Handle Excel date serial numbers
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }
  // Handle "YYYY-MM-DD", "YYYY.MM.DD", "YYYYMMDD" etc.
  const cleaned = s.replace(/[./]/g, "-");
  const match = cleaned.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAgentOrganizationId(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;
    const incomeType =
      (formData.get("incomeType") as IncomeType) ?? "EARNED_INCOME";
    const save = formData.get("save") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "엑셀 파일을 첨부해주세요." },
        { status: 400 },
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "사업자를 선택해주세요." },
        { status: 400 },
      );
    }

    let parsedCompanyId: string;
    try {
      parsedCompanyId = companyId;
    } catch {
      return NextResponse.json(
        { error: "유효한 사업자 ID가 아닙니다." },
        { status: 400 },
      );
    }

    // 권한 확인
    const companyLink = await prisma.agentOrganizationCompany.findUnique({
      where: {
        agentOrganizationId_companyId: {
          agentOrganizationId: auth.organizationId,
          companyId: parsedCompanyId,
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

    // 파일 파싱
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

    if (incomeType === "BUSINESS_INCOME") {
      return handleBusinessIncome(
        worksheet,
        fileName,
        sheetName,
        companyId,
        parsedCompanyId,
        save,
      );
    }

    if (incomeType === "OTHER_INCOME") {
      return handleOtherIncome(
        worksheet,
        fileName,
        sheetName,
        companyId,
        parsedCompanyId,
        save,
      );
    }

    if (incomeType === "OTHER_INCOME_LABOR") {
      return handleDailyLaborIncome(
        worksheet,
        fileName,
        sheetName,
        companyId,
        parsedCompanyId,
        save,
      );
    }

    const { columns, rows } = parseEmployeeRegistration(worksheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "엑셀 파일에 직원 데이터가 없습니다." },
        { status: 400 },
      );
    }

    // 사원코드 컬럼 확인
    if (!columns.includes("사원코드")) {
      return NextResponse.json(
        {
          error: `사원코드 컬럼을 찾을 수 없습니다.\n(감지된 컬럼: ${columns.join(", ")})`,
        },
        { status: 400 },
      );
    }

    // 급여 데이터에서 사원코드 목록 조회 (해당 회사의 모든 업로드에서)
    const salaryEmployeeCodes = await prisma.earnedIncome.findMany({
      where: {
        upload: { companyId: parsedCompanyId },
      },
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
        companyId: parsedCompanyId,
        deletedAt: null,
        employeeCode: { not: null },
      },
      select: { employeeCode: true },
    });
    const existingCodeSet = new Set(
      existingEmployees.map((e) => e.employeeCode),
    );

    // 매핑 결과 생성
    const mappedRows: Record<string, unknown>[] = rows.map((row) => {
      const code = String(row["사원코드"] ?? "").trim();
      const hasSalary = salaryCodeSet.has(code);
      const salaryName = salaryCodeNameMap.get(code) ?? null;
      const alreadyRegistered = existingCodeSet.has(code);

      return {
        ...row,
        _employeeCode: code,
        _hasSalaryMatch: hasSalary,
        _salaryEmployeeName: salaryName,
        _alreadyRegistered: alreadyRegistered,
      };
    });

    const matchedCount = mappedRows.filter((r) => r._hasSalaryMatch).length;
    const unmatchedCount = mappedRows.filter((r) => !r._hasSalaryMatch).length;
    const alreadyRegisteredCount = mappedRows.filter(
      (r) => r._alreadyRegistered,
    ).length;

    if (save) {
      // 저장: Employee 레코드 생성/업데이트
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

        // 은행 정보
        const bankName = toStr(row["급여이체은행"]);
        const accountNumber = toStr(row["계좌번호"]);
        const accountHolder = toStr(row["예금주"]);

        // upsert Employee
        const employee = await prisma.employee.upsert({
          where: {
            companyId_employeeCode: {
              companyId: parsedCompanyId,
              employeeCode: code,
            },
          },
          update: {
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
            publishStatus: "SAVED",
            deletedAt: null,
          },
          create: {
            companyId: parsedCompanyId,
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
            publishStatus: "SAVED",
          },
        });

        // 은행 계좌 처리
        if (bankName && accountNumber) {
          const existingAccounts = await prisma.employeeBankAccount.findMany({
            where: {
              employeeId: employee.id,
              deletedAt: null,
            },
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
        published: false,
        publishStatus: "SAVED",
        savedCount,
        skippedCount,
        fileName,
        sheetName,
        companyId,
        incomeType,
        totalRows: rows.length,
        matchedCount,
        unmatchedCount,
        alreadyRegisteredCount,
        columns,
        rows: mappedRows.slice(0, 100),
      });
    }

    // 미리보기만 반환
    return NextResponse.json({
      success: true,
      saved: false,
      fileName,
      sheetName,
      companyId,
      incomeType,
      totalRows: rows.length,
      matchedCount,
      unmatchedCount,
      alreadyRegisteredCount,
      columns,
      rows: mappedRows,
    });
  } catch (error) {
    console.error("Employee upload error:", error);
    return NextResponse.json(
      { error: "파일 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

async function handleBusinessIncome(
  worksheet: XLSX.WorkSheet,
  fileName: string,
  sheetName: string,
  companyId: string,
  parsedCompanyId: string,
  save: boolean,
) {
  const { columns, rows } = parseBusinessIncomeEmployeeRegistration(worksheet);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "엑셀 파일에 직원 데이터가 없습니다." },
      { status: 400 },
    );
  }

  // 코드 컬럼 확인
  if (!columns.includes("코드")) {
    return NextResponse.json(
      {
        error: `코드 컬럼을 찾을 수 없습니다.\n(감지된 컬럼: ${columns.join(", ")})`,
      },
      { status: 400 },
    );
  }

  // 급여(사업소득) 데이터에서 사원코드 목록 조회
  const salaryEmployeeCodes = await prisma.businessIncome.findMany({
    where: {
      upload: { companyId: parsedCompanyId },
    },
    select: { employeeCode: true, employeeName: true },
    distinct: ["employeeCode"],
  });

  const salaryCodeSet = new Set(salaryEmployeeCodes.map((r) => r.employeeCode));
  const salaryCodeNameMap = new Map(
    salaryEmployeeCodes.map((r) => [r.employeeCode, r.employeeName]),
  );

  // 기존 사업소득자 테이블에서 사원코드 목록 조회
  const existingEmployees = await prisma.businessIncomeEmployee.findMany({
    where: {
      companyId: parsedCompanyId,
      deletedAt: null,
      employeeCode: { not: null },
    },
    select: { employeeCode: true },
  });
  const existingCodeSet = new Set(existingEmployees.map((e) => e.employeeCode));

  // 매핑 결과 생성
  const mappedRows: Record<string, unknown>[] = rows.map((row) => {
    const code = String(row["코드"] ?? "").trim();
    const hasSalary = salaryCodeSet.has(code);
    const salaryName = salaryCodeNameMap.get(code) ?? null;
    const alreadyRegistered = existingCodeSet.has(code);

    return {
      ...row,
      _employeeCode: code,
      _hasSalaryMatch: hasSalary,
      _salaryEmployeeName: salaryName,
      _alreadyRegistered: alreadyRegistered,
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

      const name = toStr(row["성명"]) ?? "";
      if (!name) continue;

      const residentNumber = toStr(row["주민(외국인)등록번호"]);
      const nationalityType = toStr(row["내/외국인"]);
      const incomeCategory = toStr(row["소득구분"]);
      const residenceType = toStr(row["거주구분"]);
      const businessName = toStr(row["상호"]);
      const businessRegistrationNumber = toStr(row["사업자등록번호"]);
      const businessAddress = toStr(row["사업장주소"]);
      const address = toStr(row["소득자주소"]);
      const zipcode = toStr(row["우편번호"]);

      await prisma.businessIncomeEmployee.upsert({
        where: {
          companyId_employeeCode: {
            companyId: parsedCompanyId,
            employeeCode: code,
          },
        },
        update: {
          name,
          residentNumber,
          nationalityType,
          incomeCategory,
          residenceType,
          businessName,
          businessRegistrationNumber,
          businessAddress,
          address,
          zipcode,
          publishStatus: "SAVED",
          deletedAt: null,
        },
        create: {
          companyId: parsedCompanyId,
          employeeCode: code,
          name,
          residentNumber,
          nationalityType,
          incomeCategory,
          residenceType,
          businessName,
          businessRegistrationNumber,
          businessAddress,
          address,
          zipcode,
          publishStatus: "SAVED",
        },
      });

      savedCount++;
    }

    skippedCount = mappedRows.length - savedCount;

    return NextResponse.json({
      success: true,
      saved: true,
      published: false,
      publishStatus: "SAVED",
      savedCount,
      skippedCount,
      fileName,
      sheetName,
      companyId,
      incomeType: "BUSINESS_INCOME",
      totalRows: rows.length,
      matchedCount,
      unmatchedCount,
      alreadyRegisteredCount,
      columns,
      rows: mappedRows.slice(0, 100),
    });
  }

  // 미리보기만 반환
  return NextResponse.json({
    success: true,
    saved: false,
    fileName,
    sheetName,
    companyId,
    incomeType: "BUSINESS_INCOME",
    totalRows: rows.length,
    matchedCount,
    unmatchedCount,
    alreadyRegisteredCount,
    columns,
    rows: mappedRows,
  });
}

async function handleOtherIncome(
  worksheet: XLSX.WorkSheet,
  fileName: string,
  sheetName: string,
  companyId: string,
  parsedCompanyId: string,
  save: boolean,
) {
  const { columns, rows } = parseOtherIncomeEmployeeRegistration(worksheet);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "엑셀 파일에 직원 데이터가 없습니다." },
      { status: 400 },
    );
  }

  // 코드 컬럼 확인
  if (!columns.includes("코드")) {
    return NextResponse.json(
      {
        error: `코드 컬럼을 찾을 수 없습니다.\n(감지된 컬럼: ${columns.join(", ")})`,
      },
      { status: 400 },
    );
  }

  // 급여(기타소득) 데이터에서 사원코드 목록 조회
  const salaryEmployeeCodes = await prisma.otherIncome.findMany({
    where: {
      upload: { companyId: parsedCompanyId },
    },
    select: { employeeCode: true, employeeName: true },
    distinct: ["employeeCode"],
  });

  const salaryCodeSet = new Set(salaryEmployeeCodes.map((r) => r.employeeCode));
  const salaryCodeNameMap = new Map(
    salaryEmployeeCodes.map((r) => [r.employeeCode, r.employeeName]),
  );

  // 기존 기타소득자 테이블에서 사원코드 목록 조회
  const existingEmployees = await prisma.otherIncomeEmployee.findMany({
    where: {
      companyId: parsedCompanyId,
      deletedAt: null,
      employeeCode: { not: null },
    },
    select: { employeeCode: true },
  });
  const existingCodeSet = new Set(existingEmployees.map((e) => e.employeeCode));

  // 매핑 결과 생성
  const mappedRows: Record<string, unknown>[] = rows.map((row) => {
    const code = String(row["코드"] ?? "").trim();
    const hasSalary = salaryCodeSet.has(code);
    const salaryName = salaryCodeNameMap.get(code) ?? null;
    const alreadyRegistered = existingCodeSet.has(code);

    return {
      ...row,
      _employeeCode: code,
      _hasSalaryMatch: hasSalary,
      _salaryEmployeeName: salaryName,
      _alreadyRegistered: alreadyRegistered,
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

      const name = toStr(row["성명"]) ?? "";
      if (!name) continue;

      const residentNumber = toStr(row["주민(외국인)등록번호"]);
      const nationalityType = toStr(row["내/외국인"]);
      const incomeCategory = toStr(row["소득구분"]);
      const residenceType = toStr(row["거주구분"]);
      const personType = toStr(row["법인/개인구분"]);
      const businessRegistrationNumber = toStr(row["사업자등록번호"]);
      const businessAddress = toStr(row["사업장주소"]);
      const zipcode = toStr(row["우편번호"]);
      const phone = toStr(row["전화번호"]);

      await prisma.otherIncomeEmployee.upsert({
        where: {
          companyId_employeeCode: {
            companyId: parsedCompanyId,
            employeeCode: code,
          },
        },
        update: {
          name,
          residentNumber,
          nationalityType,
          incomeCategory,
          residenceType,
          personType,
          businessRegistrationNumber,
          businessAddress,
          zipcode,
          phone,
          publishStatus: "SAVED",
          deletedAt: null,
        },
        create: {
          companyId: parsedCompanyId,
          employeeCode: code,
          name,
          residentNumber,
          nationalityType,
          incomeCategory,
          residenceType,
          personType,
          businessRegistrationNumber,
          businessAddress,
          zipcode,
          phone,
          publishStatus: "SAVED",
        },
      });

      savedCount++;
    }

    skippedCount = mappedRows.length - savedCount;

    return NextResponse.json({
      success: true,
      saved: true,
      published: false,
      publishStatus: "SAVED",
      savedCount,
      skippedCount,
      fileName,
      sheetName,
      companyId,
      incomeType: "OTHER_INCOME",
      totalRows: rows.length,
      matchedCount,
      unmatchedCount,
      alreadyRegisteredCount,
      columns,
      rows: mappedRows.slice(0, 100),
    });
  }

  // 미리보기만 반환
  return NextResponse.json({
    success: true,
    saved: false,
    fileName,
    sheetName,
    companyId,
    incomeType: "OTHER_INCOME",
    totalRows: rows.length,
    matchedCount,
    unmatchedCount,
    alreadyRegisteredCount,
    columns,
    rows: mappedRows,
  });
}

function toDecimal(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return isNaN(v) ? null : v;
  const s = String(v).trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

async function handleDailyLaborIncome(
  worksheet: XLSX.WorkSheet,
  fileName: string,
  sheetName: string,
  companyId: string,
  parsedCompanyId: string,
  save: boolean,
) {
  const { columns, rows } = parseDailyLaborEmployeeRegistration(worksheet);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "엑셀 파일에 직원 데이터가 없습니다." },
      { status: 400 },
    );
  }

  // 코드 컬럼 확인 (일용직사원명부는 "코드" 헤더에 공백 포함 가능)
  const codeCol = columns.find((c) => c.replace(/\s/g, "") === "코드");
  if (!codeCol) {
    return NextResponse.json(
      {
        error: `코드 컬럼을 찾을 수 없습니다.\n(감지된 컬럼: ${columns.join(", ")})`,
      },
      { status: 400 },
    );
  }

  // 성명 컬럼 (공백 포함 가능)
  const nameCol = columns.find((c) => c.replace(/\s/g, "") === "성명");

  // 급여(일용직소득) 데이터에서 사원코드 목록 조회
  const salaryEmployeeCodes = await prisma.dailyIncomeLabor.findMany({
    where: {
      upload: { companyId: parsedCompanyId },
    },
    select: { employeeCode: true, employeeName: true },
    distinct: ["employeeCode"],
  });

  const salaryCodeSet = new Set(salaryEmployeeCodes.map((r) => r.employeeCode));
  const salaryCodeNameMap = new Map(
    salaryEmployeeCodes.map((r) => [r.employeeCode, r.employeeName]),
  );

  // 기존 일용직 직원 테이블에서 사원코드 목록 조회
  const existingEmployees = await prisma.otherIncomeLaborEmployee.findMany({
    where: {
      companyId: parsedCompanyId,
      deletedAt: null,
      employeeCode: { not: null },
    },
    select: { employeeCode: true },
  });
  const existingCodeSet = new Set(existingEmployees.map((e) => e.employeeCode));

  // 매핑 결과 생성
  const mappedRows: Record<string, unknown>[] = rows.map((row) => {
    const code = String(row[codeCol] ?? "").trim();
    const hasSalary = salaryCodeSet.has(code);
    const salaryName = salaryCodeNameMap.get(code) ?? null;
    const alreadyRegistered = existingCodeSet.has(code);

    return {
      ...row,
      _employeeCode: code,
      _hasSalaryMatch: hasSalary,
      _salaryEmployeeName: salaryName,
      _alreadyRegistered: alreadyRegistered,
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

    // 컬럼명 헬퍼 (공백 포함 가능한 헤더 대응)
    const findCol = (keyword: string) =>
      columns.find((c) => c.replace(/\s/g, "") === keyword) ?? keyword;

    for (const row of mappedRows) {
      const code = String(row._employeeCode ?? "").trim();
      if (!code) continue;

      const name = toStr(row[nameCol ?? "성명"]) ?? "";
      if (!name) continue;

      const residentNumber = toStr(row[findCol("주민등록번호")]);
      const department = toStr(row[findCol("부서")]);
      const positionTitle = toStr(row[findCol("직급")]);
      const hireDate = toDateStr(row[findCol("입사일")]);
      const resignDate = toDateStr(row[findCol("퇴사일")]);
      const jobCategory = toStr(row[findCol("직종")]);
      const payType = toStr(row[findCol("급여형태")]);
      const paymentMethod = toStr(row[findCol("지급방법")]);
      const overtimeType = toStr(row[findCol("연장형태")]);
      const normalPay = toDecimal(row[findCol("정상급여")]);
      const overtimePay = toDecimal(row[findCol("연장급여")]);
      const address = toStr(row[findCol("주소")]);
      const bankName = toStr(row[findCol("은행")]);
      const accountNumber = toStr(row[findCol("계좌번호")]);
      const siteName = toStr(row[findCol("현장")]);

      await prisma.otherIncomeLaborEmployee.upsert({
        where: {
          companyId_employeeCode: {
            companyId: parsedCompanyId,
            employeeCode: code,
          },
        },
        update: {
          name,
          residentNumber,
          department,
          positionTitle,
          hireDate,
          resignDate,
          jobCategory,
          payType,
          paymentMethod,
          overtimeType,
          normalPay,
          overtimePay,
          address,
          bankName,
          accountNumber,
          siteName,
          publishStatus: "SAVED",
          deletedAt: null,
        },
        create: {
          companyId: parsedCompanyId,
          employeeCode: code,
          name,
          residentNumber,
          department,
          positionTitle,
          hireDate,
          resignDate,
          jobCategory,
          payType,
          paymentMethod,
          overtimeType,
          normalPay,
          overtimePay,
          address,
          bankName,
          accountNumber,
          siteName,
          publishStatus: "SAVED",
        },
      });

      savedCount++;
    }

    skippedCount = mappedRows.length - savedCount;

    return NextResponse.json({
      success: true,
      saved: true,
      published: false,
      publishStatus: "SAVED",
      savedCount,
      skippedCount,
      fileName,
      sheetName,
      companyId,
      incomeType: "OTHER_INCOME_LABOR",
      totalRows: rows.length,
      matchedCount,
      unmatchedCount,
      alreadyRegisteredCount,
      columns,
      rows: mappedRows.slice(0, 100),
    });
  }

  // 미리보기만 반환
  return NextResponse.json({
    success: true,
    saved: false,
    fileName,
    sheetName,
    companyId,
    incomeType: "OTHER_INCOME_LABOR",
    totalRows: rows.length,
    matchedCount,
    unmatchedCount,
    alreadyRegisteredCount,
    columns,
    rows: mappedRows,
  });
}
