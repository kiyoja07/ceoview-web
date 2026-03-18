import type { Metadata } from "next";
import prisma from "@/app/lib/prisma";
import { hashPayslipAccessToken } from "@/app/lib/payslip-access";
import { buildEarnedPayslipData } from "@/app/lib/payslip-earned";
import { PayslipViewer } from "./PayslipViewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "급여명세서 열람",
  robots: {
    index: false,
    follow: false,
  },
};

function InvalidPayslipView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-950/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm9-3.758a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
      </div>
    </main>
  );
}

export default async function PayslipViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const normalizedToken = token?.trim();

  if (!normalizedToken) {
    return (
      <InvalidPayslipView
        title="유효하지 않은 링크입니다"
        description="전달받은 링크를 다시 확인하거나 새 급여명세서 링크를 요청해 주세요."
      />
    );
  }

  const tokenHash = hashPayslipAccessToken(normalizedToken);
  const now = new Date();

  const accessToken = await prisma.payslipAccessToken.findUnique({
    where: { tokenHash },
    include: {
      earnedIncome: {
        include: {
          itemValues: {
            include: {
              itemDefinition: {
                select: { name: true, kind: true },
              },
            },
          },
          upload: {
            include: {
              company: {
                select: {
                  businessName: true,
                  businessNumber: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (
    !accessToken ||
    accessToken.usedAt ||
    accessToken.revokedAt ||
    accessToken.expiresAt <= now
  ) {
    return (
      <InvalidPayslipView
        title="만료되었거나 이미 사용된 링크입니다"
        description="급여명세서 링크는 1회용이며 만료시간이 있습니다. 새 링크를 다시 발송해 주세요."
      />
    );
  }

  const markUsedResult = await prisma.payslipAccessToken.updateMany({
    where: {
      id: accessToken.id,
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (markUsedResult.count !== 1) {
    return (
      <InvalidPayslipView
        title="사용할 수 없는 링크입니다"
        description="이미 열람 처리되었거나 만료된 링크입니다. 새 링크를 요청해 주세요."
      />
    );
  }

  const payslipData = buildEarnedPayslipData(accessToken.earnedIncome, {
    businessName: accessToken.earnedIncome.upload.company.businessName,
    businessNumber: accessToken.earnedIncome.upload.company.businessNumber,
  });

  return <PayslipViewer payslipData={payslipData} />;
}
