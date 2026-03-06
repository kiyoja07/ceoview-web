import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getCompanyUserIdFromRequest } from "@/app/lib/company-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getCompanyUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const user = await prisma.companyUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        companyId: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const invites = await prisma.companyUserInviteHistory.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        contactType: true,
        contact: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        inviterAgentUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const now = new Date();

    return NextResponse.json({
      invites: invites.map((inv) => ({
        id: inv.id.toString(),
        contactType: inv.contactType,
        contact:
          inv.contactType === "email" ? inv.contact : maskPhone(inv.contact),
        role: inv.role,
        inviterName: inv.inviterAgentUser.name ?? "-",
        inviterEmail: maskEmail(inv.inviterAgentUser.email),
        expiresAt: inv.expiresAt.toISOString(),
        isExpired: inv.expiresAt < now,
        createdAt: inv.createdAt.toISOString(),
      })),
      total: invites.length,
    });
  } catch (error) {
    console.error("Company invite history GET error:", error);
    return NextResponse.json(
      { error: "초대 이력 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}
