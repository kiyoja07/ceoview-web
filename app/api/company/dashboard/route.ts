import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { resolveCompanyAccessContext } from "@/app/lib/company-access";
import {
  resolveUploadForCompanyView,
  serializeUploadViewSelection,
} from "@/app/lib/salary-upload-view";
import type { CompanyDashboardResponse } from "@/types/company/dashboard";
import { getEmployeeStatus } from "@/types/company/employees";

const DASHBOARD_MONTHS = 6;

type MonthBucket = {
  totalPayment: number;
  totalDeduction: number;
  netPayment: number;
  earnedPayment: number;
  businessPayment: number;
  dailyPayment: number;
  otherPayment: number;
  earnedCount: number;
  businessCount: number;
  dailyCount: number;
  otherCount: number;
};

async function requireCompanyMember(request: NextRequest) {
  const context = await resolveCompanyAccessContext(request);
  if (!context) {
    return { error: "로그인이 필요합니다.", status: 401 } as const;
  }

  return context;
}

function createEmptyBucket(): MonthBucket {
  return {
    totalPayment: 0,
    totalDeduction: 0,
    netPayment: 0,
    earnedPayment: 0,
    businessPayment: 0,
    dailyPayment: 0,
    otherPayment: 0,
    earnedCount: 0,
    businessCount: 0,
    dailyCount: 0,
    otherCount: 0,
  };
}

function getRecentYms(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - count + index + 1,
      1,
    );
    return date.getFullYear() * 100 + (date.getMonth() + 1);
  });
}

function formatYmLabel(ym: number) {
  return `${String(ym).slice(0, 4)}.${String(ym).slice(4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCompanyMember(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const companyId = auth.currentCompanyId;
    const recentYms = getRecentYms(DASHBOARD_MONTHS);
    const startYm = recentYms[0];
    const endYm = recentYms[recentYms.length - 1];

    const publishedWhere = {
      companyId,
      deletedAt: null,
      publishStatus: "PUBLISHED" as const,
    };

    const [
      company,
      employees,
      businessEmployeeCount,
      otherEmployeeCount,
      dailyEmployeeCount,
      earnedView,
      businessView,
      otherView,
      dailyView,
    ] =
      await Promise.all([
        prisma.company.findUnique({
          where: { id: companyId },
          select: {
            id: true,
            businessName: true,
            businessNumber: true,
            organizationLink: {
              select: {
                agentOrganization: {
                  select: {
                    id: true,
                    organizationName: true,
                    organizationNumber: true,
                    representativeName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        }),
        prisma.employee.findMany({
          where: publishedWhere,
          select: {
            phone: true,
            email: true,
            hireDate: true,
            resignDate: true,
            createdAt: true,
            bankAccounts: {
              where: { deletedAt: null },
              select: { id: true },
              take: 1,
            },
          },
        }),
        prisma.businessIncomeEmployee.count({
          where: publishedWhere,
        }),
        prisma.otherIncomeEmployee.count({
          where: publishedWhere,
        }),
        prisma.otherIncomeLaborEmployee.count({
          where: publishedWhere,
        }),
        resolveUploadForCompanyView(request, companyId, "EARNED_INCOME"),
        resolveUploadForCompanyView(request, companyId, "BUSINESS_INCOME"),
        resolveUploadForCompanyView(request, companyId, "OTHER_INCOME"),
        resolveUploadForCompanyView(request, companyId, "OTHER_INCOME_LABOR"),
      ]);

    if (!company) {
      return NextResponse.json(
        { error: "회사 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const [earnedStats, businessStats, otherStats, dailyStats] =
      await Promise.all([
        earnedView.uploadId
          ? prisma.earnedIncome.groupBy({
              by: ["paymentYm"],
              where: {
                uploadId: earnedView.uploadId,
                paymentYm: { gte: startYm, lte: endYm },
              },
              _count: true,
              _sum: {
                totalPayment: true,
                totalDeduction: true,
                netPayment: true,
              },
            })
          : Promise.resolve([]),
        businessView.uploadId
          ? prisma.businessIncome.groupBy({
              by: ["paymentYm"],
              where: {
                uploadId: businessView.uploadId,
                paymentYm: { gte: startYm, lte: endYm },
              },
              _count: true,
              _sum: {
                grossPayment: true,
                incomeTax: true,
                localIncomeTax: true,
                expenseArtSpec: true,
                employmentIns: true,
                studentLoan: true,
                industrialAcc: true,
                netPayment: true,
              },
            })
          : Promise.resolve([]),
        otherView.uploadId
          ? prisma.otherIncome.groupBy({
              by: ["paymentYm"],
              where: {
                uploadId: otherView.uploadId,
                paymentYm: { gte: startYm, lte: endYm },
              },
              _count: true,
              _sum: {
                grossPayment: true,
                taxCorpTax: true,
                localIncomeTax: true,
                netPayment: true,
              },
            })
          : Promise.resolve([]),
        dailyView.uploadId && dailyView.uploadedAt
          ? prisma.dailyIncomeLabor.groupBy({
              by: ["uploadId"],
              where: { uploadId: dailyView.uploadId },
              _count: true,
              _sum: {
                grossPay: true,
                employmentIns: true,
                nationalPension: true,
                healthIns: true,
                incomeTax: true,
                localIncomeTax: true,
                longTermCare: true,
                netPay: true,
              },
            })
          : Promise.resolve([]),
      ]);

    const monthlyMap = new Map<number, MonthBucket>();
    for (const ym of recentYms) {
      monthlyMap.set(ym, createEmptyBucket());
    }

    for (const row of earnedStats) {
      const entry = monthlyMap.get(row.paymentYm) ?? createEmptyBucket();
      const payment = Number(row._sum.totalPayment ?? 0);
      entry.totalPayment += payment;
      entry.totalDeduction += Number(row._sum.totalDeduction ?? 0);
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.earnedPayment += payment;
      entry.earnedCount += row._count;
      monthlyMap.set(row.paymentYm, entry);
    }

    for (const row of businessStats) {
      const entry = monthlyMap.get(row.paymentYm) ?? createEmptyBucket();
      const payment = Number(row._sum.grossPayment ?? 0);
      const deduction =
        Number(row._sum.incomeTax ?? 0) +
        Number(row._sum.localIncomeTax ?? 0) +
        Number(row._sum.expenseArtSpec ?? 0) +
        Number(row._sum.employmentIns ?? 0) +
        Number(row._sum.studentLoan ?? 0) +
        Number(row._sum.industrialAcc ?? 0);

      entry.totalPayment += payment;
      entry.totalDeduction += deduction;
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.businessPayment += payment;
      entry.businessCount += row._count;
      monthlyMap.set(row.paymentYm, entry);
    }

    for (const row of otherStats) {
      const entry = monthlyMap.get(row.paymentYm) ?? createEmptyBucket();
      const payment = Number(row._sum.grossPayment ?? 0);
      entry.totalPayment += payment;
      entry.totalDeduction +=
        Number(row._sum.taxCorpTax ?? 0) + Number(row._sum.localIncomeTax ?? 0);
      entry.netPayment += Number(row._sum.netPayment ?? 0);
      entry.otherPayment += payment;
      entry.otherCount += row._count;
      monthlyMap.set(row.paymentYm, entry);
    }

    if (dailyView.uploadedAt) {
      const ym =
        dailyView.uploadedAt.getFullYear() * 100 +
        (dailyView.uploadedAt.getMonth() + 1);

      if (ym >= startYm && ym <= endYm) {
        const entry = monthlyMap.get(ym) ?? createEmptyBucket();
        for (const row of dailyStats) {
          const payment = Number(row._sum.grossPay ?? 0);
          const deduction =
            Number(row._sum.employmentIns ?? 0) +
            Number(row._sum.nationalPension ?? 0) +
            Number(row._sum.healthIns ?? 0) +
            Number(row._sum.incomeTax ?? 0) +
            Number(row._sum.localIncomeTax ?? 0) +
            Number(row._sum.longTermCare ?? 0);

          entry.totalPayment += payment;
          entry.totalDeduction += deduction;
          entry.netPayment += Number(row._sum.netPay ?? 0);
          entry.dailyPayment += payment;
          entry.dailyCount += row._count;
        }
        monthlyMap.set(ym, entry);
      }
    }

    const recentMonths = recentYms.map((ym) => {
      const values = monthlyMap.get(ym) ?? createEmptyBucket();
      return {
        ym,
        label: formatYmLabel(ym),
        totalPayment: Math.round(values.totalPayment),
        netPayment: Math.round(values.netPayment),
        totalCount:
          values.earnedCount +
          values.businessCount +
          values.dailyCount +
          values.otherCount,
      };
    });

    const latestMonth =
      [...recentMonths].reverse().find((item) => item.totalCount > 0) ?? null;

    const joinedThreshold = new Date();
    joinedThreshold.setDate(joinedThreshold.getDate() - 30);

    let active = 0;
    let upcoming = 0;
    let leaving = 0;
    let inactive = 0;
    let noHireDate = 0;
    let withContact = 0;
    let withEmail = 0;
    let withBankAccount = 0;
    let recentJoined = 0;

    const latestBucket = latestMonth
      ? (monthlyMap.get(latestMonth.ym) ?? createEmptyBucket())
      : createEmptyBucket();

    for (const employee of employees) {
      const status = getEmployeeStatus(employee.hireDate, employee.resignDate);

      if (status === "재직중") active += 1;
      else if (status === "입사예정") upcoming += 1;
      else if (status === "퇴사예정") leaving += 1;
      else if (status === "퇴사완료") inactive += 1;

      if (!employee.hireDate) noHireDate += 1;

      if (employee.email?.trim() || employee.bankAccounts.length > 0)
        withContact += 1;
      if (employee.email?.trim()) withEmail += 1;
      if (employee.bankAccounts.length > 0) withBankAccount += 1;
      if (employee.createdAt >= joinedThreshold) recentJoined += 1;
    }

    const response: CompanyDashboardResponse = {
      company: {
        id: company.id.toString(),
        businessName: company.businessName,
        businessNumber: company.businessNumber,
      },
      agentOrganization: company.organizationLink?.agentOrganization
        ? {
            id: company.organizationLink.agentOrganization.id.toString(),
            organizationName:
              company.organizationLink.agentOrganization.organizationName,
            organizationNumber:
              company.organizationLink.agentOrganization.organizationNumber,
            representativeName:
              company.organizationLink.agentOrganization.representativeName,
            phone: company.organizationLink.agentOrganization.phone,
          }
        : null,
      salary: {
        hasData: latestMonth != null,
        latestYm: latestMonth?.ym ?? null,
        latestLabel: latestMonth?.label ?? null,
        totalPayment: latestMonth?.totalPayment ?? 0,
        netPayment: latestMonth?.netPayment ?? 0,
        totalCount: latestMonth?.totalCount ?? 0,
        publicationByType: {
          earned: serializeUploadViewSelection(earnedView),
          business: serializeUploadViewSelection(businessView),
          daily: serializeUploadViewSelection(dailyView),
          other: serializeUploadViewSelection(otherView),
        },
        recentMonths,
      },
      employees: {
        total: employees.length,
        active,
        upcoming,
        leaving,
        inactive,
        noHireDate,
        withContact,
        withEmail,
        withBankAccount,
        recentJoined,
        earnedMasterCount: employees.length,
        businessMasterCount: businessEmployeeCount,
        otherMasterCount: otherEmployeeCount,
        dailyMasterCount: dailyEmployeeCount,
        earnedRecentPaidCount: latestBucket.earnedCount,
        businessRecentPaidCount: latestBucket.businessCount,
        otherRecentPaidCount: latestBucket.otherCount,
        dailyRecentPaidCount: latestBucket.dailyCount,
        earnedCount: latestBucket.earnedCount,
        businessCount: latestBucket.businessCount,
        otherCount: latestBucket.otherCount,
        dailyCount: latestBucket.dailyCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Company dashboard GET error:", error);
    return NextResponse.json(
      { error: "대시보드 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
